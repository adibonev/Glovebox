import {
  SupabaseDocumentRepository,
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { SERVICE_TYPE_CODES, SERVICE_TYPE_LABELS, formatDateShort } from "./labels";
import { currentAuthUser, currentUser } from "./session";

export type DocView = {
  id: string;
  name: string;
  url: string | null;
  isImage: boolean;
};

export type ServiceGroup = {
  serviceId: string;
  serviceType: string;
  code: string;
  typeLabel: string;
  expiryLabel: string;
  documents: DocView[];
};

export type VehicleGroup = {
  vehicleId: string;
  name: string;
  services: ServiceGroup[];
};

export type DocumentsData = {
  userEmail: string;
  vehicles: VehicleGroup[];
  totalDocuments: number;
  hasServices: boolean;
};

export async function getDocumentsData(): Promise<DocumentsData | null> {
  const supabase = await createClient();
  // Request-cached: the page shell asks for the same two rows, and pays for them once.
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const user = await currentUser();
  if (!user) return null;

  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const services = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);
  const documents = await new SupabaseDocumentRepository(supabase).listByUser(user.id);

  // One batch of short-lived signed URLs for the private files (RLS lets the owner read).
  const urlByPath = new Map<string, string>();
  if (documents.length > 0) {
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrls(
        documents.map((d) => d.path),
        3600,
      );
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  const docsByService = new Map<string, DocView[]>();
  for (const d of documents) {
    const list = docsByService.get(d.serviceRecordId) ?? [];
    list.push({
      id: d.id,
      name: d.name,
      url: urlByPath.get(d.path) ?? null,
      isImage: (d.mimeType ?? "").startsWith("image/"),
    });
    docsByService.set(d.serviceRecordId, list);
  }

  const servicesByVehicle = new Map<string, ServiceGroup[]>();
  for (const s of [...services].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())) {
    const group = servicesByVehicle.get(s.vehicleId) ?? [];
    group.push({
      serviceId: s.id,
      serviceType: s.serviceType,
      code: SERVICE_TYPE_CODES[s.serviceType] ?? "—",
      typeLabel: SERVICE_TYPE_LABELS[s.serviceType] ?? s.serviceType,
      expiryLabel: formatDateShort(s.expiryDate),
      documents: docsByService.get(s.id) ?? [],
    });
    servicesByVehicle.set(s.vehicleId, group);
  }

  const vehicleGroups: VehicleGroup[] = vehicles
    .map((v) => ({
      vehicleId: v.id,
      name: `${v.brand} ${v.model}`,
      services: servicesByVehicle.get(v.id) ?? [],
    }))
    .filter((g) => g.services.length > 0);

  return {
    userEmail: authUser.email ?? "",
    vehicles: vehicleGroups,
    totalDocuments: documents.length,
    hasServices: services.length > 0,
  };
}
