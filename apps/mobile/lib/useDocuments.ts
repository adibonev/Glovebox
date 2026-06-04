import {
  SupabaseDocumentRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "./auth";
import { signedUrls } from "./documents";
import { SERVICE_TYPE_LABELS, formatDateShort } from "./labels";
import { supabase } from "./supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const documentRepo = new SupabaseDocumentRepository(supabase);

export type DocView = { id: string; name: string; path: string; url: string | null; isImage: boolean };
export type ServiceGroup = { serviceId: string; typeLabel: string; expiryLabel: string; documents: DocView[] };
export type VehicleGroup = { vehicleId: string; name: string; services: ServiceGroup[] };

/** Loads the User's Vehicles → Service Records → Documents (with signed URLs) for the docs tab. */
export function useDocuments() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));
      setUserId(user.id);

      const [vehicles, services, documents] = await Promise.all([
        vehicleRepo.listByUser(user.id),
        serviceRepo.listByUser(user.id),
        documentRepo.listByUser(user.id),
      ]);
      const urls = await signedUrls(documents.map((d) => d.path));

      const docsByService = new Map<string, DocView[]>();
      for (const d of documents) {
        const list = docsByService.get(d.serviceRecordId) ?? [];
        list.push({
          id: d.id,
          name: d.name,
          path: d.path,
          url: urls.get(d.path) ?? null,
          isImage: (d.mimeType ?? "").startsWith("image/"),
        });
        docsByService.set(d.serviceRecordId, list);
      }

      const servicesByVehicle = new Map<string, ServiceGroup[]>();
      for (const s of [...services].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())) {
        const group = servicesByVehicle.get(s.vehicleId) ?? [];
        group.push({
          serviceId: s.id,
          typeLabel: SERVICE_TYPE_LABELS[s.serviceType] ?? s.serviceType,
          expiryLabel: formatDateShort(s.expiryDate),
          documents: docsByService.get(s.id) ?? [],
        });
        servicesByVehicle.set(s.vehicleId, group);
      }

      const result: VehicleGroup[] = vehicles
        .map((v) => ({
          vehicleId: v.id,
          name: `${v.brand} ${v.model}`,
          services: servicesByVehicle.get(v.id) ?? [],
        }))
        .filter((g) => g.services.length > 0);
      setGroups(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на документите.");
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load().finally(() => {
        if (active && !loadedOnce.current) {
          loadedOnce.current = true;
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  return { groups, userId, loading, refreshing, error, onRefresh, reload: load };
}
