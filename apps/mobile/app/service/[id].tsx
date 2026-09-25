import {
  DOCUMENT_SCAN_ENABLED,
  SupabaseMileageReadingRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  isExpiringServiceType,
  mileageSource,
  scanInspectionDocument,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { DocumentCamera } from "@/components/DocumentCamera";
import {
  ChipPicker,
  DangerButton,
  DateField,
  Field,
  PrimaryButton,
  VignettePresets,
} from "@/components/forms";
import { RegistryCheckLink } from "@/components/RegistryCheckLink";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { parseCost } from "@/lib/cost";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from "@/lib/labels";
import { parseKm, todayAsDate } from "@/lib/mileage";
import { useDocumentRecognition } from "@/lib/recognize";
import { supabase } from "@/lib/supabase";

const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);
const mileageRepo = new SupabaseMileageReadingRepository(supabase);
const TYPE_OPTIONS = SERVICE_TYPE_ORDER.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }));

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { recognize, reader, engineLabel } = useDocumentRecognition();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"form" | "camera" | "reading">("form");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [cost, setCost] = useState("");
  const [mileage, setMileage] = useState("");
  /** The Inspection date off a scanned certificate. Kilometres typed in by hand are today's. */
  const [mileageReadOn, setMileageReadOn] = useState<Date | null>(null);
  /** What the certificate said, to tell a read number from one the User then changed. */
  const [kmRead, setKmRead] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiring = serviceType ? isExpiringServiceType(serviceType) : true;
  const inspection = serviceType === "inspection";

  useEffect(() => {
    let active = true;
    serviceRepo
      .getById(id)
      .then((record) => {
        if (!active || !record) return;
        setVehicleId(record.vehicleId);
        setServiceType(record.serviceType);
        setExpiryDate(record.expiryDate);
        setCost(record.cost != null ? String(record.cost) : "");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  /**
   * A renewed Inspection comes with a new certificate, and it carries both things this screen
   * wants: the new Expiry Date and what the odometer showed on the day. The second is how the
   * Mileage chart grows — one reading per Inspection, a year apart.
   */
  const readCertificate = async (dataUrl: string) => {
    setStage("reading");
    try {
      const draft = scanInspectionDocument({ text: await recognize(dataUrl) });
      if (draft.serviceRecord) setExpiryDate(draft.serviceRecord.expiryDate);
      if (draft.mileage) {
        setMileage(String(draft.mileage.km));
        setMileageReadOn(draft.mileage.readOn);
        setKmRead(draft.mileage.km);
      }
      setNote(
        draft.serviceRecord
          ? `Разчетено с ${engineLabel}. Провери срока и километрите.`
          : "Срокът не се разчете — въведи го ръчно.",
      );
    } catch {
      setNote("Разчитането не сработи. Въведи данните ръчно.");
    } finally {
      setStage("form");
    }
  };

  const save = async () => {
    if (!serviceType) return;
    setSaving(true);
    setError(null);
    try {
      await serviceRepo.update(id, { serviceType, expiryDate, cost: parseCost(cost) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
      return;
    }

    const km = inspection ? parseKm(mileage) : null;
    if (km !== null && vehicleId && session) {
      try {
        const user = await userRepo.findOrCreateByAuthId({
          authUserId: session.user.id,
          email: session.user.email ?? "",
        });
        await mileageRepo.record({
          vehicleId,
          userId: user.id,
          km,
          readOn: mileageReadOn ?? todayAsDate(),
          source: mileageSource(km, kmRead),
        });
      } catch {
        // The Expiry Date is saved by now; say so, rather than suggest that nothing was.
        setError("Срокът е записан, но километрите не. Опитай пак.");
        setSaving(false);
        return;
      }
    }
    router.back();
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

  if (stage === "camera") {
    return (
      <View className="flex-1 bg-ink">
        {reader}
        <DocumentCamera
          onCapture={(url) => void readCertificate(url)}
          onCancel={() => setStage("form")}
        />
      </View>
    );
  }

  if (stage === "reading") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-ink px-8">
        {reader}
        <ActivityIndicator color={colors.copper} />
        <Text className="text-center text-base text-silver">Разчитам документа…</Text>
      </View>
    );
  }

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
      {reader}
      {inspection && DOCUMENT_SCAN_ENABLED && (
        <Pressable
          onPress={() => setStage("camera")}
          className="mb-4 rounded-2xl border border-copper/60 bg-copper/15 p-5"
        >
          <Text className="text-lg font-semibold text-ivory">Снимай новия талон</Text>
          <Text className="mt-1.5 text-sm leading-5 text-silver">
            Новият срок и километрите се попълват сами.
          </Text>
        </Pressable>
      )}
      {note && (
        <View className="mb-4 rounded-xl border border-copper/40 bg-panel p-4">
          <Text className="text-sm leading-5 text-silver">{note}</Text>
        </View>
      )}
      <ChipPicker label="Вид услуга" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      <DateField label={expiring ? "Валидна до" : "Дата на разход"} value={expiryDate} onChange={setExpiryDate} />
      {serviceType === "vignette" && <VignettePresets onPick={setExpiryDate} />}
      <RegistryCheckLink serviceType={serviceType} />
      {inspection && (
        <>
          <Field
            label="Километри · по избор"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            placeholder="напр. 185000"
          />
          <Text className="-mt-2 mb-4 text-xs leading-4 text-muted">
            Пазим километрите от всеки преглед, за да видиш в „Анализ“ колко караш на година.
          </Text>
        </>
      )}
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
