import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  canAddService,
  isExpiringServiceType,
} from "@glovebox/core";
import { addYears } from "@glovebox/core/schedule";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ChipPicker, DateField, Field, PrimaryButton, VignettePresets } from "@/components/forms";
import { RegistryCheckLink } from "@/components/RegistryCheckLink";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { pickDocument, uploadDocument, type PickedFile } from "@/lib/documents";
import { dataChanged } from "@/lib/freshness";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, parseCost } from "@/lib/labels";
import { todayAsDate } from "@/lib/mileage";
import { recordOwner } from "@/lib/ownership";
import { getPlan } from "@/lib/plan";
import { supabase } from "@/lib/supabase";
import { useGarage } from "@/lib/useGarage";

const userRepo = new SupabaseUserRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const TYPE_OPTIONS = SERVICE_TYPE_ORDER.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }));

/**
 * A new Service Record on the car the dashboard was showing, named at the top. The date starts a
 * year on (an obligation just paid for runs about that long), or today for a Repair, until the
 * User picks one.
 */
export default function NewServiceScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { data } = useGarage();
  const vehicle = data?.cards.find((card) => card.vehicle.id === vehicleId)?.vehicle ?? null;
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [cost, setCost] = useState("");
  const [doc, setDoc] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiring = serviceType ? isExpiringServiceType(serviceType) : true;
  const today = todayAsDate();
  const expiryDate = pickedDate ?? (expiring ? addYears(today, 1) : today);

  const submit = async () => {
    if (!session || !vehicleId || !serviceType) return;
    setSaving(true);
    setError(null);
    try {
      const user = await userRepo.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" });

      // Quota gate: Free is capped at 2 Service Records per Vehicle (ADR-0003).
      const plan = await getPlan(user.id);
      const existing = await serviceRepo.listByVehicle(vehicleId);
      if (!canAddService(plan, existing.length)) {
        setError("Безплатният план е до 2 срока на кола. С Pro добавяш колкото искаш, от сайта.");
        setSaving(false);
        return;
      }

      const created = await serviceRepo.create({
        vehicleId,
        // The owner's, also when a family member adds it to a shared car.
        userId: await recordOwner(vehicleId),
        serviceType,
        expiryDate,
        cost: parseCost(cost),
      });
      dataChanged();

      // Attach the picked Document to the new Service Record.
      if (doc) {
        try {
          await uploadDocument(session.user.id, created.id, doc);
        } catch {
          setError("Срокът е записан, но документът не се качи. Прикачи го от екрана на срока.");
          setSaving(false);
          return;
        }
      }
      router.back();
    } catch {
      setError("Срокът не беше записан. Провери връзката и опитай пак.");
      setSaving(false);
    }
  };

  return (
    <Screen title="Нов срок">
      {vehicle && (
        <Text className="-mt-4 mb-5 text-sm text-muted">
          За <Text className="text-ivory">{vehicle.brand} {vehicle.model}</Text>
          {vehicle.plate ? ` · ${vehicle.plate}` : ""}
        </Text>
      )}
      <ChipPicker label="Вид" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      <DateField label={expiring ? "В сила до" : "Дата на разхода"} value={expiryDate} onChange={setPickedDate} />
      {serviceType === "vignette" && <VignettePresets value={expiryDate} onPick={setPickedDate} />}
      <RegistryCheckLink serviceType={serviceType} />
      <Field label="Цена (€) · по избор" value={cost} onChangeText={setCost} placeholder="напр. 120" keyboardType="decimal-pad" />

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
            {doc ? doc.name : "Прикачи файл (PDF или снимка)"}
          </Text>
        </Pressable>
      </View>

      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton
        label={expiring ? "Запази срока" : "Запази разхода"}
        onPress={() => void submit()}
        loading={saving}
        disabled={!serviceType}
      />
    </Screen>
  );
}
