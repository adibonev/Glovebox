import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  canAddService,
} from "@glovebox/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { ChipPicker, DateField, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from "@/lib/labels";
import { getPlan } from "@/lib/plan";
import { supabase } from "@/lib/supabase";

const userRepo = new SupabaseUserRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const TYPE_OPTIONS = SERVICE_TYPE_ORDER.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }));

/** Sensible default expiry: one year out (typical for ГО / Каско / Технически преглед). */
function oneYearOut(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default function NewServiceScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date>(oneYearOut);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!session || !vehicleId || !serviceType) return;
    setSaving(true);
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));

      // Quota gate: Free is capped at 2 Service Records per Vehicle (ADR-0003).
      const plan = await getPlan(user.id);
      const existing = await serviceRepo.listByVehicle(vehicleId);
      if (!canAddService(plan, existing.length)) {
        setError("Достигна лимита на Free (2 услуги). Надгради до Pro от уеб приложението.");
        setSaving(false);
        return;
      }

      await serviceRepo.create({ vehicleId, userId: user.id, serviceType, expiryDate });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Screen title="Нова услуга">
      <ChipPicker label="Вид услуга" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      <DateField label="Валидна до" value={expiryDate} onChange={setExpiryDate} />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази" onPress={submit} loading={saving} disabled={!serviceType} />
    </Screen>
  );
}
