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
    const { data } = await worker.recognize(file);
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
