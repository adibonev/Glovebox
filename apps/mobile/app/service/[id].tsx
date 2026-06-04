import { SupabaseServiceRecordRepository, isExpiringServiceType } from "@glovebox/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { ChipPicker, DangerButton, DateField, Field, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { parseCost } from "@/lib/cost";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from "@/lib/labels";
import { supabase } from "@/lib/supabase";

const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const TYPE_OPTIONS = SERVICE_TYPE_ORDER.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }));

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiring = serviceType ? isExpiringServiceType(serviceType) : true;

  useEffect(() => {
    let active = true;
    serviceRepo
      .getById(id)
      .then((record) => {
        if (!active || !record) return;
        setServiceType(record.serviceType);
        setExpiryDate(record.expiryDate);
        setCost(record.cost != null ? String(record.cost) : "");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const save = async () => {
    if (!serviceType) return;
    setSaving(true);
    setError(null);
    try {
      await serviceRepo.update(id, { serviceType, expiryDate, cost: parseCost(cost) });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Изтриване на услуга", "Сигурен ли си?", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          try {
            await serviceRepo.delete(id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Грешка при изтриване.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen title="Редакция">
        <View className="mt-10 items-center">
          <ActivityIndicator color="#C4954C" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Редакция на услуга">
      <ChipPicker label="Вид услуга" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      <DateField label={expiring ? "Валидна до" : "Дата на разход"} value={expiryDate} onChange={setExpiryDate} />
      <Field
        label="Цена (€) · по избор"
        value={cost}
        onChangeText={setCost}
        placeholder="напр. 120"
        keyboardType="decimal-pad"
      />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази" onPress={save} loading={saving} disabled={!serviceType} />
      <DangerButton label="Изтрий услугата" onPress={confirmDelete} />
    </Screen>
  );
}
