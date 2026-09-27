import {
  FUEL_TYPES,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  parseFuelType,
  type FuelType,
} from "@glovebox/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { ChipPicker, DangerButton, Field, OptionalDateField, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { SelectField } from "@/components/SelectField";
import {
  BODY_TYPE_LABELS,
  BODY_TYPE_OPTIONS,
  parseBodyType,
  type BodyType,
} from "@/lib/bodyType";
import { hasModel, makeOptions, modelOptions, yearOptions } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { DELETE_FAILED, deleteVehicle } from "@/lib/erasure";
import { dataChanged } from "@/lib/freshness";
import { earliestFirstRegistration, firstRegistrationError } from "@/lib/firstRegistration";
import { FUEL_TYPE_LABELS } from "@/lib/fuelType";
import { supabase } from "@/lib/supabase";

const vehicleRepo = new SupabaseVehicleRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);
const BODY_OPTIONS = BODY_TYPE_OPTIONS.map((b) => ({ value: b, label: BODY_TYPE_LABELS[b] }));

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  /** Only the owner deletes a car; a family member it is shared with can edit it. */
  const [mine, setMine] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [bodyType, setBodyType] = useState<BodyType>("sedan");
  const [fuelType, setFuelType] = useState<FuelType | null>(null);
  const [firstRegistration, setFirstRegistration] = useState<Date | null>(null);
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
        setFuelType(parseFuelType(v.fuelType));
        setFirstRegistration(v.firstRegistration);
        if (session) {
          void userRepo
            .findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" })
            .then((user) => active && setMine(v.userId === user.id));
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, session]);

  /** Changing the make invalidates the model: an Octavia is not an Audi. */
  const chooseMake = (make: string) => {
    setBrand(make);
    if (!hasModel(make, model)) setModel("");
  };

  const save = async () => {
    if (!brand.trim() || !model.trim()) return;
    const dateError = firstRegistrationError(firstRegistration, year);
    if (dateError) {
      setError(dateError);
      return;
    }
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
        fuelType,
        firstRegistration,
      });
      dataChanged();
      router.back();
    } catch {
      setError("Промените не са записани. Провери връзката и опитай пак.");
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(`Да изтрия ли ${brand} ${model}?`, "Изтриват се и всичките ѝ срокове и документи.", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVehicle(id);
            router.back();
          } catch {
            setError(DELETE_FAILED);
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
    <Screen title="Редакция на кола">
      <SelectField
        label="Марка"
        value={brand}
        options={makeOptions(brand)}
        onChange={chooseMake}
        placeholder="Избери марка"
      />
      <SelectField
        label="Модел"
        value={model}
        options={modelOptions(brand, model)}
        onChange={setModel}
        placeholder="Избери модел"
        disabled={!brand}
        disabledHint="Първо избери марка."
      />
      <SelectField
        label="Година"
        value={year}
        options={yearOptions()}
        onChange={setYear}
        placeholder="Избери година"
      />
      <Field label="Регистрационен номер" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
      <Field label="Рама (VIN) · по избор" value={vin} onChangeText={setVin} autoCapitalize="characters" maxLength={17} />
      <OptionalDateField
        label="Дата на първа регистрация · по избор"
        hint="Поле (B) на талона. С нея знаем кога е прегледът на кола под пет години."
        value={firstRegistration}
        onChange={setFirstRegistration}
        minimumDate={earliestFirstRegistration(year)}
      />
      <ChipPicker label="Тип каросерия" value={bodyType} options={BODY_OPTIONS} onChange={setBodyType} />
      <ChipPicker
        label="Гориво"
        value={fuelType}
        options={FUEL_TYPES.map((type) => ({ value: type, label: FUEL_TYPE_LABELS[type] }))}
        onChange={setFuelType}
      />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази" onPress={save} loading={saving} disabled={!brand.trim() || !model.trim()} />
      {mine && <DangerButton label="Изтрий колата" onPress={confirmDelete} />}
    </Screen>
  );
}
