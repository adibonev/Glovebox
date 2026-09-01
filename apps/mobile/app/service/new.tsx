import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  canAddService,
  isExpiringServiceType,
} from "@glovebox/core";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ChipPicker, DateField, Field, PrimaryButton, VignettePresets } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { parseCost } from "@/lib/cost";
import { pickDocument, uploadDocument, type PickedFile } from "@/lib/documents";
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
  const [cost, setCost] = useState("");
  const [doc, setDoc] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiring = serviceType ? isExpiringServiceType(serviceType) : true;

  const submit = async () => {
    if (!session || !vehicleId || !serviceType) return;
    setSaving(true);
    setError(null);
    try {
      const user =
        await userRepo.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" });

      // Quota gate: Free is capped at 2 Service Records per Vehicle (ADR-0003).
      const plan = await getPlan(user.id);
      const existing = await serviceRepo.listByVehicle(vehicleId);
      if (!canAddService(plan, existing.length)) {
        setError("Достигна лимита на Free (2 услуги). Надгради до Pro от уеб приложението.");
        setSaving(false);
        return;
      }

      const created = await serviceRepo.create({
        vehicleId,
        userId: user.id,
        serviceType,
        expiryDate,
        cost: parseCost(cost),
      });

      // Attach the picked Document to the new Service Record (visible in „Документи").
      if (doc) {
        await uploadDocument(session.user.id, user.id, created.id, doc);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Screen title="Нова услуга">
      <ChipPicker label="Вид услуга" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      <DateField label={expiring ? "Валидна до" : "Дата на разход"} value={expiryDate} onChange={setExpiryDate} />
      {serviceType === "vignette" && <VignettePresets onPick={setExpiryDate} />}
      <Field
        label="Цена (€) · по избор"
        value={cost}
        onChangeText={setCost}
        placeholder="напр. 120"
        keyboardType="decimal-pad"
      />

      <View className="mb-4">
        <Text className="mb-1.5 text-sm text-muted">Документ · по избор</Text>
        <Pressable
          onPress={async () => {
            const file = await pickDocument();
            if (file) setDoc(file);
          }}
          className="flex-row items-center gap-2 rounded-xl border border-white/10 bg-panel px-4 py-3.5"
        >
          <Ionicons name="attach" size={18} color={colors.copper} />
          <Text className="flex-1 text-base text-ivory" numberOfLines={1}>
            {doc ? doc.name : "Прикачи файл (PDF/снимка)"}
          </Text>
        </Pressable>
      </View>

      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази" onPress={submit} loading={saving} disabled={!serviceType} />
    </Screen>
  );
}
