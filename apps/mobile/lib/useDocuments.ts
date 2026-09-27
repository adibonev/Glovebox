import {
  SupabaseDocumentRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";
import { useCallback, useState } from "react";

import { useAuth } from "./auth";
import { signedUrls } from "./documents";
import { useLoadWhenStale } from "./freshness";
import { SERVICE_TYPE_ORDER, formatRecordLabel } from "./labels";
import { reportProblem } from "./monitoring";
import { supabase } from "./supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const documentRepo = new SupabaseDocumentRepository(supabase);

export type DocView = {
  id: string;
  name: string;
  path: string;
  url: string | null;
  isImage: boolean;
  /** The Service Record the file belongs to, named. */
  record: { id: string; label: string };
};
/** A Service Record a file can be attached to. */
export type AttachableRecord = { id: string; label: string };
export type VehicleDocuments = {
  vehicleId: string;
  name: string;
  records: AttachableRecord[];
  /** The files uploaded to this car's records, newest first. */
  documents: DocView[];
};

const order = (serviceType: string) => {
  const index = (SERVICE_TYPE_ORDER as readonly string[]).indexOf(serviceType);
  return index === -1 ? SERVICE_TYPE_ORDER.length : index;
};

/**
 * The User's uploaded files by car, each naming its Service Record, plus every record a file can
 * be attached to. Only the files: a card per record, most of them empty, hid the few files there
 * were (the website's Documents page works the same way).
 */
export function useDocuments() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<VehicleDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const user = await userRepo.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" });
      const [vehicles, services, documents] = await Promise.all([
        vehicleRepo.listByUser(user.id),
        serviceRepo.listByUser(user.id),
        documentRepo.listByUser(user.id),
      ]);
      const urls = await signedUrls(documents.map((d) => d.path));
      const recordById = new Map(services.map((s) => [s.id, s]));

      setGroups(
        vehicles.map((v) => ({
          vehicleId: v.id,
          name: `${v.brand} ${v.model}`,
          records: services
            .filter((s) => s.vehicleId === v.id)
            .sort((a, b) => order(a.serviceType) - order(b.serviceType) || b.expiryDate.getTime() - a.expiryDate.getTime())
            .map((s) => ({ id: s.id, label: formatRecordLabel(s.serviceType, s.expiryDate) })),
          // Newest first, as the repository returns them.
          documents: documents.flatMap((d) => {
            const record = recordById.get(d.serviceRecordId);
            if (!record || record.vehicleId !== v.id) return [];
            return [
              {
                id: d.id,
                name: d.name,
                path: d.path,
                url: urls.get(d.path) ?? null,
                isImage: (d.mimeType ?? "").startsWith("image/"),
                record: { id: record.id, label: formatRecordLabel(record.serviceType, record.expiryDate) },
              },
            ];
          }),
        })),
      );
      setError(null);
    } catch (e) {
      reportProblem(`documents load failed: ${e instanceof Error ? e.message : String(e)}`);
      setError("Документите не се заредиха. Дръпни надолу, за да опиташ пак.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  const reload = useLoadWhenStale(load);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void reload().finally(() => setRefreshing(false));
  }, [reload]);

  return { groups, loading, refreshing, error, onRefresh, reload };
}
