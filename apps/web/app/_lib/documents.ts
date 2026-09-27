import {
  SupabaseDocumentRepository,
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { SERVICE_TYPE_ORDER, formatRecordLabel } from "./labels";
import { currentAuthUser, currentUser } from "./session";

export type DocView = {
  id: string;
  name: string;
  url: string | null;
  isImage: boolean;
  /** The Service Record the file belongs to, when the list mixes several (the Documents page). */
  record?: { id: string; label: string };
};

/** A Service Record a file can be attached to, as the upload picker offers it. */
export type AttachableRecord = { id: string; label: string };

export type VehicleDocuments = {
  vehicleId: string;
  name: string;
  /** Records of this car, for the upload picker. */
  records: AttachableRecord[];
  /** The files uploaded to this car's records, newest first. */
  documents: DocView[];
};

export type DocumentsData = {
  userEmail: string;
  vehicles: VehicleDocuments[];
  totalDocuments: number;
};

/**
 * The User's uploaded files, by car, each naming the Service Record it is attached to. Only the
 * files: a card for every record, most of them saying "Няма прикачени документи", repeated the
 * dashboard and hid the few files there were.
 */
export async function getDocumentsData(): Promise<DocumentsData | null> {
  const supabase = await createClient();
  // Request-cached: the page shell asks for the same two rows, and pays for them once.
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const user = await currentUser();
  if (!user) return null;

  const [vehicles, services, documents] = await Promise.all([
    new SupabaseVehicleRepository(supabase).listByUser(user.id),
    new SupabaseServiceRecordRepository(supabase).listByUser(user.id),
    new SupabaseDocumentRepository(supabase).listByUser(user.id),
  ]);

  // One batch of short-lived signed URLs for the private files (RLS lets the owner read).
  const urlByPath = new Map<string, string>();
  if (documents.length > 0) {
    const { data: signed } = await supabase.storage.from("documents").createSignedUrls(
      documents.map((d) => d.path),
      3600,
    );
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  const recordById = new Map(services.map((s) => [s.id, s]));
  const order = (serviceType: string) => {
    const index = (SERVICE_TYPE_ORDER as readonly string[]).indexOf(serviceType);
    return index === -1 ? SERVICE_TYPE_ORDER.length : index;
  };

  const groups: VehicleDocuments[] = vehicles.map((v) => {
    const records = services
      .filter((s) => s.vehicleId === v.id)
      .sort((a, b) => order(a.serviceType) - order(b.serviceType) || b.expiryDate.getTime() - a.expiryDate.getTime())
      .map((s) => ({ id: s.id, label: formatRecordLabel(s.serviceType, s.expiryDate) }));

    const files = documents
      // Newest first, as the repository returns them.
      .filter((d) => recordById.get(d.serviceRecordId)?.vehicleId === v.id)
      .map((d) => {
        const record = recordById.get(d.serviceRecordId)!;
        return {
          id: d.id,
          name: d.name,
          url: urlByPath.get(d.path) ?? null,
          isImage: (d.mimeType ?? "").startsWith("image/"),
          record: { id: record.id, label: formatRecordLabel(record.serviceType, record.expiryDate) },
        };
      });

    return { vehicleId: v.id, name: `${v.brand} ${v.model}`, records, documents: files };
  });

  return {
    userEmail: authUser.email ?? "",
    vehicles: groups,
    totalDocuments: documents.length,
  };
}
