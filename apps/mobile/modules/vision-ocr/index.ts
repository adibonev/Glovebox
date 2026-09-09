import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * Text recognition through Apple Vision, when the device offers it.
 *
 * Optional on purpose. The module is iOS-only, so on Android — and in Expo Go, where no custom
 * native code is linked — this resolves to null and the caller falls back to the WebView engine
 * rather than failing.
 */
type VisionOcr = {
  supportedLanguages(): Promise<string[]>;
  recognize(source: string, languages: string[]): Promise<string>;
};

const native = requireOptionalNativeModule<VisionOcr>("VisionOcr");

/** Whether this build can recognise text natively. */
export const visionOcrAvailable = native != null;

/** The recognition languages this device has. Empty when Vision is unavailable. */
export async function visionSupportedLanguages(): Promise<string[]> {
  return (await native?.supportedLanguages()) ?? [];
}

/**
 * Recognise a `file://` or `data:` image. `languages` is a preference, not a demand: anything
 * the device does not have is dropped, and Vision falls back to its default.
 */
export async function visionRecognize(source: string, languages: string[]): Promise<string> {
  if (!native) throw new Error("Native text recognition is not available in this build.");
  return native.recognize(source, languages);
}
