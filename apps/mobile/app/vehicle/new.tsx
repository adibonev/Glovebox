import {
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  canAddVehicle,
} from "@glovebox/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { ChipPicker, Field, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { BODY_TYPES, BODY_TYPE_LABELS, type BodyType } from "@/lib/bodyType";
import { getPlan } from "@/lib/plan";
import { supabase } from "@/lib/supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const BODY_OPTIONS = BODY_TYPES.map((b) => ({ value: b, label: BODY_TYPE_LABELS[b] }));

export default function NewVehicleScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [bodyType, setBodyType] = useState<BodyType>("sedan");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!session || !brand.trim() || !model.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));

      // Quota gate: Free is capped at 1 Vehicle (ADR-0003).
      const plan = await getPlan(user.id);
      const existing = await vehicleRepo.listByUser(user.id);
      if (!canAddVehicle(plan, existing.length)) {
        setError("Достигна лимита на Free (1 кола). Надгради до Pro от уеб приложението.");
        setSaving(false);
        return;
      }

      const parsedYear = year.trim() ? Number(year.trim()) : null;
      await vehicleRepo.create({
        userId: user.id,
        brand: brand.trim(),
        model: model.trim(),
        year: parsedYear !== null && !Number.isNaN(parsedYear) ? parsedYear : null,
        plate: plate.trim() || null,
        bodyType,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Screen title="Нов автомобил">
      <Field label="Марка" value={brand} onChangeText={setBrand} placeholder="напр. BMW" />
      <Field label="Модел" value={model} onChangeText={setModel} placeholder="напр. 320d" />
      <Field
        label="Година"
        value={year}
        onChangeText={setYear}
        placeholder="напр. 2019"
        keyboardType="number-pad"
        maxLength={4}
      />
      <Field
        label="Регистрационен номер"
        value={plate}
        onChangeText={setPlate}
        placeholder="напр. CB1234AB"
        autoCapitalize="characters"
      />
      <ChipPicker label="Тип каросерия" value={bodyType} options={BODY_OPTIONS} onChange={setBodyType} />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton
        label="Запази"
        onPress={submit}
        loading={saving}
        disabled={!brand.trim() || !model.trim()}
      />
    </Screen>
  );
}
