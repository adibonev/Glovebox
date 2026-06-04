import { SupabaseDocumentRepository } from "@glovebox/core";
import { decode } from "base64-arraybuffer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import { supabase } from "./supabase";

const documentRepo = new SupabaseDocumentRepository(supabase);
const BUCKET = "documents";

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
};

/** Opens the system picker; returns the chosen PDF/image, or null if cancelled. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null, size: asset.size ?? null };
}

/** Uploads the file bytes to the private bucket and records the Document row (core seam). */
export async function uploadDocument(
  authUserId: string,
  userId: string,
  serviceId: string,
  file: PickedFile,
): Promise<void> {
  // Path prefix is the auth uid so Storage RLS keeps the file private to its owner.
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-120) || "file";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${authUserId}/${serviceId}/${unique}__${safeName}`;

  const base64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage.from(BUCKET).upload(path, decode(base64), {
    contentType: file.mimeType ?? "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  await documentRepo.create({
    serviceRecordId: serviceId,
    userId,
    path,
    name: file.name.slice(0, 200),
    mimeType: file.mimeType,
    sizeBytes: file.size,
  });
}

/** Removes the Storage object and the Document row. */
export async function deleteDocument(id: string, path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
  await documentRepo.delete(id);
}

/** Batch of short-lived signed URLs (path → url) for viewing private files. */
export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) map.set(entry.path, entry.signedUrl);
  }
  return map;
}
