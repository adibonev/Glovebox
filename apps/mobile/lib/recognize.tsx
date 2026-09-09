import { useCallback, useRef, useState } from "react";

import { DocumentReader, type DocumentReaderHandle } from "@/components/DocumentReader";
import { visionOcrAvailable, visionRecognize } from "@/modules/vision-ocr";

/**
 * Preferences, not demands — anything the device lacks is dropped by the module.
 *
 * Bulgarian is not among Vision's languages, but Russian is, and the two alphabets differ by
 * three letters Bulgarian does not use. English is there for the VIN, the plate and the
 * numbers, which are Latin.
 */
const VISION_LANGUAGES = ["bg-BG", "ru-RU", "en-US"];

/**
 * Reading a photographed document, whichever engine this build has.
 *
 * Vision is native, fast and absent on Android and in Expo Go; the WebView engine works
 * everywhere and is slow. The difference is a whole mounted component, which is why this hands
 * back an element to render rather than just a function: the WebView has to stay mounted across
 * the stages of a scan so it is warm by the time a photo arrives.
 */
export function useDocumentRecognition() {
  const readerRef = useRef<DocumentReaderHandle | null>(null);
  const [progress, setProgress] = useState(0);

  const recognize = useCallback(async (source: string): Promise<string> => {
    if (visionOcrAvailable) return visionRecognize(source, VISION_LANGUAGES);

    const reader = readerRef.current;
    if (!reader) throw new Error("Разчитането още не е готово. Опитай пак след миг.");
    return reader.read(source);
  }, []);

  return {
    recognize,
    /** Render this somewhere in the screen; null when Vision does the reading. */
    reader: visionOcrAvailable ? null : (
      <DocumentReader handleRef={readerRef} onProgress={setProgress} />
    ),
    /** 0–1 while the WebView engine works. Vision reports nothing: it is over too quickly. */
    progress,
    reportsProgress: !visionOcrAvailable,
    engineLabel: visionOcrAvailable ? "Apple Vision" : "резервния двигател",
  };
}
