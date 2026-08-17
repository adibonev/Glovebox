/**
 * Limits for Document uploads that ride along a Server Action.
 *
 * A Server Action request body is capped by Next (`serverActions.bodySizeLimit`) and, on
 * Vercel, by the platform itself (4.5 MB). Over the cap the request is rejected before our
 * code runs, so the form must refuse the file first — otherwise the submit fails silently.
 */

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const MAX_DOCUMENT_LABEL = "4 MB";

/** A Bulgarian message when a picked file is too large, or `null` when it fits. */
export function documentTooLargeMessage(file: { size: number } | null | undefined): string | null {
  if (!file || file.size <= MAX_DOCUMENT_BYTES) return null;
  const mb = (file.size / (1024 * 1024)).toFixed(1).replace(".", ",");
  return `Файлът е ${mb} MB — максимумът е ${MAX_DOCUMENT_LABEL}. Намали го или го качи по-късно.`;
}
