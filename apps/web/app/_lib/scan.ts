"use client";

/**
 * Reading a photographed document in the browser.
 *
 * The I/O half of the Document Scan seam: this produces the text and QR payloads, and
 * `scanInspectionDocument` in `@glovebox/core` interprets them. Same split as the Registry
 * Check — logic in `core`, capture at the edge.
 *
 * Everything runs **on the User's own device**. The photo is never uploaded to recognise it,
 * so a document full of personal data (name, ЕГН, plate, VIN) never reaches a third party —
 * and never reaches us either unless the User separately chooses to save it as a Document.
 */

import type { DocumentScanInput } from "@glovebox/core";

/**
 * Bulgarian for the labels, English for the Latin fields. The VIN and the plate are Latin
 * characters printed among Cyrillic text, and the English model reads those far better.
 */
const LANGUAGES = "bul+eng";

/** How far along the recognition is, for a progress bar. `0..1`. */
export type ScanProgress = (fraction: number) => void;

// The Barcode Detection API is not in TypeScript's DOM lib yet, and is absent in Safari.
// Declared minimally here rather than pulled in as a dependency — a missing detector just
// means no QR, which the Draft handles.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

/** QR payloads found in the image, or an empty list when the browser cannot look. */
async function readQrCodes(file: File): Promise<string[]> {
  const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  if (!Detector || typeof createImageBitmap !== "function") return [];

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const codes = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
      return codes.map((code) => code.rawValue).filter((value) => value !== "");
    } finally {
      bitmap.close();
    }
  } catch {
    // An unreadable image is not an error here — the text half may still succeed.
    return [];
  }
}

/**
 * Resolution Tesseract wants for body text. A phone photo of an A4 page taken at arm's length
 * puts the small print near the engine's lower limit, which is where a VIN comes back as
 * fragments; enlarging before recognition costs a moment and recovers most of it.
 */
const MIN_LONG_SIDE = 2200;
const MAX_LONG_SIDE = 3600;

/**
 * Prepare a photo for recognition: size it into the range the engine reads best, and drop the
 * colour. The certificate is printed on a pale blue guilloche background, and greyscale removes
 * that cast without touching the dark text.
 *
 * Returns the original file untouched if anything is unavailable — a worse scan beats no scan.
 */
async function prepareImage(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale =
      longest < MIN_LONG_SIDE
        ? MIN_LONG_SIDE / longest
        : longest > MAX_LONG_SIDE
          ? MAX_LONG_SIDE / longest
          : 1;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      // Rec. 601 luma — the weighting that keeps blue ink dark instead of washing it out.
      const grey = 0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0);
      px[i] = px[i + 1] = px[i + 2] = grey;
    }
    ctx.putImageData(image, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Printed text read off the image by Tesseract, running in a Web Worker on this device. */
async function recognizeText(file: File, onProgress?: ScanProgress): Promise<string> {
  // Imported lazily: the engine and its language data are several megabytes and must not
  // land in the initial bundle of a page most Users never scan from.
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker(LANGUAGES, undefined, {
    logger: ({ progress, status }) => {
      if (status === "recognizing text") onProgress?.(progress);
    },
  });

  try {
    const { data } = await worker.recognize(await prepareImage(file));
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Read one photographed or scanned document into the input `scanInspectionDocument` expects.
 *
 * The two halves are independent: a document with no QR still yields its text, and a frame
 * whose text is unreadable still yields its QR. Neither failure stops the other.
 */
export async function readDocument(
  file: File,
  onProgress?: ScanProgress,
): Promise<DocumentScanInput> {
  const [qrPayloads, text] = await Promise.all([
    readQrCodes(file),
    recognizeText(file, onProgress),
  ]);

  return { text, qrPayloads };
}
