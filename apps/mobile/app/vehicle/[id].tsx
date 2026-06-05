import { SupabaseVehicleRepository } from "@glovebox/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { ChipPicker, DangerButton, Field, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { BODY_TYPES, BODY_TYPE_LABELS, parseBodyType, type BodyType } from "@/lib/bodyType";
import { supabase } from "@/lib/supabase";

const vehicleRepo = new SupabaseVehicleRepository(supabase);
const BODY_OPTIONS = BODY_TYPES.map((b) => ({ value: b, label: BODY_TYPE_LABELS[b] }));

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [bodyType, setBodyType] = useState<BodyType>("sedan");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    vehicleRepo
      .getById(id)
      .then((v) => {
        if (!active || !v) return;
        setBrand(v.brand);
        setModel(v.model);
        setYear(v.year !== null ? String(v.year) : "");
        setPlate(v.plate ?? "");
        setVin(v.vin ?? "");
        setBodyType(parseBodyType(v.bodyType));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const save = async () => {
    if (!brand.trim() || !model.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const parsedYear = year.trim() ? Number(year.trim()) : null;
      await vehicleRepo.update(id, {
        brand: brand.trim(),
        model: model.trim(),
        year: parsedYear !== null && !Number.isNaN(parsedYear) ? parsedYear : null,
        plate: plate.trim() || null,
        vin: vin.trim().toUpperCase() || null,
        bodyType,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Изтриване на автомобил", "Това ще изтрие и всички негови услуги. Сигурен ли си?", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          try {
            await vehicleRepo.delete(id);
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
    <Screen title="Редакция на автомобил">
      <Field label="Марка" value={brand} onChangeText={setBrand} />
      <Field label="Модел" value={model} onChangeText={setModel} />
      <Field label="Година" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
      <Field label="Регистрационен номер" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
      <Field label="VIN / рама (по избор)" value={vin} onChangeText={setVin} autoCapitalize="characters" maxLength={17} />
      <ChipPicker label="Тип каросерия" value={bodyType} options={BODY_OPTIONS} onChange={setBodyType} />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази" onPress={save} loading={saving} disabled={!brand.trim() || !model.trim()} />
      <DangerButton label="Изтрий автомобила" onPress={confirmDelete} />
    </Screen>
  );
}
