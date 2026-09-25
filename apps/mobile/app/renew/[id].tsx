import {
  DOCUMENT_SCAN_ENABLED,
  SupabaseMileageReadingRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  inspectionDue,
  mileageSource,
  renewalMethod,
  scanInspectionDocument,
  scanPolicyDocument,
  suggestedExpiry,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { Choice, Notice } from "@/components/choices";
import { DocumentCamera } from "@/components/DocumentCamera";
import { DateField, Field, PrimaryButton, VignettePresets } from "@/components/forms";
import { RegistryCheckLink } from "@/components/RegistryCheckLink";
import { Screen } from "@/components/Screen";
import { correctedFields, track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { parseCost } from "@/lib/cost";
import { SERVICE_TYPE_LABELS, formatCost, formatDateShort } from "@/lib/labels";
import { maybeOfferInvite } from "@/lib/invite";
import { parseKm, todayAsDate } from "@/lib/mileage";
import { recordOwner } from "@/lib/ownership";
import { useDocumentRecognition } from "@/lib/recognize";
import { supabase } from "@/lib/supabase";

const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const mileageRepo = new SupabaseMileageReadingRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Obligations a driver may simply stop having, and how saying so is worded. */
const LET_GO: Record<string, { title: string; confirm: string }> = {
  casco: { title: "Вече нямам каско", confirm: "Каското се маха от колата." },
  vignette: { title: "Не ми трябва винетка сега", confirm: "Винетката се маха от колата." },
  maintenance: { title: "Махни това обслужване", confirm: "Обслужването се маха от колата." },
};

type Stage = "choice" | "camera" | "reading" | "form";

/**
 * Renewing one obligation: where a Reminder's notification and the dashboard's banner lead.
 *
 * It opens on whatever carries the new Expiry Date. A new Inspection certificate or insurance
 * policy is photographed; a Fire Extinguisher, Vehicle Tax or Maintenance has no document, so the
 * date is asked for straight away. Typing it in by hand is always one tap away.
 */
export default function RenewScreen() {
  // `from=push` when a notification opened this screen (lib/push).
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { recognize, reader, engineLabel } = useDocumentRecognition();

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("choice");
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [cost, setCost] = useState("");
  const [mileage, setMileage] = useState("");
  /** The Inspection date off a scanned certificate. Kilometres typed in by hand are today's. */
  const [mileageReadOn, setMileageReadOn] = useState<Date | null>(null);
  /** What the certificate said, to tell a read number from one the User then changed. */
  const [kmRead, setKmRead] = useState<number | null>(null);
  /** What a scan filled in, to count the fields the User then corrected. */
  const [scanRead, setScanRead] = useState<Record<string, string | null> | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const found = await serviceRepo.getById(id);
      if (!active || !found) return;
      setRecord(found);
      setExpiryDate(suggestedExpiry(found.expiryDate, new Date()));
      const method = renewalMethod(found.serviceType);
      const scannable = method === "inspectionScan" || method === "policyScan";
      setStage(scannable && DOCUMENT_SCAN_ENABLED ? "choice" : "form");
      const owner = await vehicleRepo.getById(found.vehicleId);
      if (!active) return;
      setVehicle(owner);
      // An Inspection renewed today is due again by law: on the next anniversary for a car under
      // five years old, a year on for an older one. Better than a year after the old date.
      if (method === "inspectionScan" && owner?.firstRegistration) {
        const today = todayAsDate();
        const due = inspectionDue(owner.firstRegistration, today, today);
        if (due.kind !== "needsLastInspection") setExpiryDate(due.due);
      }
    })().finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (loading || !record) {
    return (
      <Screen title="Подновяване">
        <View className="mt-10 items-center">
          {loading ? (
            <ActivityIndicator color={colors.copper} />
          ) : (
            <Text className="text-center text-base text-muted">Този срок вече не съществува.</Text>
          )}
        </View>
      </Screen>
    );
  }

  const method = renewalMethod(record.serviceType);
  const label = SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType;
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : "";
  const letGo = LET_GO[record.serviceType];

  const readDocument = async (dataUrl: string) => {
    setStage("reading");
    try {
      const text = await recognize(dataUrl);
      if (method === "inspectionScan") {
        const draft = scanInspectionDocument({ text });
        if (draft.serviceRecord) setExpiryDate(draft.serviceRecord.expiryDate);
        if (draft.mileage) {
          setMileage(String(draft.mileage.km));
          setMileageReadOn(draft.mileage.readOn);
          setKmRead(draft.mileage.km);
        }
        setNote(
          draft.serviceRecord
            ? `Разчетено с ${engineLabel}. Провери срока и километрите.`
            : "Срокът не се разчете. Въведи го ръчно.",
        );
        if (draft.serviceRecord) {
          setScanRead({
            expiry: draft.serviceRecord.expiryDate.toISOString().slice(0, 10),
            km: draft.mileage ? String(draft.mileage.km) : null,
          });
        } else {
          track("scan_failed", { document: record.serviceType });
        }
      } else {
        const draft = scanPolicyDocument({ text }, record.serviceType as "civil_liability" | "casco");
        if (draft.serviceRecord) setExpiryDate(draft.serviceRecord.expiryDate);
        if (draft.serviceRecord?.cost != null) setCost(String(draft.serviceRecord.cost));
        if (draft.serviceRecord) {
          setScanRead({
            expiry: draft.serviceRecord.expiryDate.toISOString().slice(0, 10),
            cost: draft.serviceRecord.cost != null ? String(draft.serviceRecord.cost) : null,
          });
        } else {
          track("scan_failed", { document: record.serviceType });
        }
        // A policy for another car is the one mistake a confirmation form cannot show.
        const insured = draft.insuredVehicle.plate;
        const plate = vehicle?.plate?.replace(/\s/g, "").toUpperCase();
        setNote(
          insured && plate && insured !== plate
            ? `Внимание: полицата е за ${insured}, а колата е ${plate}.`
            : draft.serviceRecord
              ? `Разчетено с ${engineLabel}. Провери срока и сумата.`
              : "Срокът не се разчете. Въведи го ръчно.",
        );
      }
    } catch {
      track("scan_failed", { document: record.serviceType });
      setNote("Разчитането не сработи. Въведи данните ръчно.");
    } finally {
      setStage("form");
    }
  };

  const save = async () => {
    if (expiryDate.getTime() <= record.expiryDate.getTime()) {
      setError(`Новият срок трябва да е след ${formatDateShort(record.expiryDate)}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await serviceRepo.update(record.id, {
        serviceType: record.serviceType,
        expiryDate,
        cost: parseCost(cost),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
      return;
    }

    const km = method === "inspectionScan" ? parseKm(mileage) : null;
    if (km !== null && session) {
      try {
        await mileageRepo.record({
          vehicleId: record.vehicleId,
          // The owner's, also when a family member renews a shared car.
          userId: vehicle?.userId ?? (await recordOwner(record.vehicleId)),
          km,
          readOn: mileageReadOn ?? todayAsDate(),
          source: mileageSource(km, kmRead),
        });
      } catch {
        // The new Expiry Date is saved by now; say so, rather than suggest that nothing was.
        setError("Срокът е записан, но километрите не. Опитай пак.");
        setSaving(false);
        return;
      }
    }
    if (scanRead) {
      track("scan_succeeded", {
        document: record.serviceType,
        corrected: correctedFields(scanRead, {
          expiry: expiryDate.toISOString().slice(0, 10),
          km: mileage,
          cost,
        }),
      });
    }
    track("renewal_saved", {
      service_type: record.serviceType,
      via: from === "push" ? "push" : "app",
      scanned: scanRead !== null,
    });
    close();
    if (session) {
      void userRepo
        .findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" })
        .then((user) => maybeOfferInvite(user.id))
        .catch(() => undefined);
    }
  };

  const confirmLetGo = () => {
    if (!letGo) return;
    Alert.alert(letGo.title, `${letGo.confirm} Няма да ти напомняме за него.`, [
      { text: "Отказ", style: "cancel" },
      {
        text: "Махни",
        style: "destructive",
        onPress: async () => {
          try {
            await serviceRepo.delete(record.id);
            close();
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
        <DocumentCamera onCapture={(url) => void readDocument(url)} onCancel={() => setStage("choice")} />
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

  const days = Math.round((record.expiryDate.getTime() - Date.now()) / MS_PER_DAY);
  const when = formatDateShort(record.expiryDate);
  const status =
    days < 0
      ? `Изтече на ${when}. Въведи новия срок, за да те подсетим навреме догодина.`
      : `Изтича на ${when}. Като го подновиш, въведи новия срок тук.`;

  return (
    <Screen title={label}>
      {reader}
      <Text className="-mt-4 mb-1 text-sm text-muted">{vehicleName}</Text>
      <Text className="mb-6 text-base leading-6 text-silver">{status}</Text>

      {stage === "choice" ? (
        <>
          <Choice
            title={method === "inspectionScan" ? "Снимай новия талон" : "Снимай новата полица"}
            body={
              method === "inspectionScan"
                ? "Новият срок и километрите се попълват сами."
                : "Новият срок и сумата се попълват сами."
            }
            tone="copper"
            onPress={() => {
              track("scan_started", { document: record.serviceType });
              setStage("camera");
            }}
          />
          <Choice
            title="Въведи ръчно"
            body="Избираш новата дата сам."
            tone="emerald"
            onPress={() => setStage("form")}
          />
        </>
      ) : (
        <>
          {note && <Notice>{note}</Notice>}
          <DateField
            label={record.serviceType === "fire_extinguisher" ? "Нова дата от етикета" : "Валидна до"}
            value={expiryDate}
            onChange={setExpiryDate}
          />
          {method === "vignette" && <VignettePresets onPick={setExpiryDate} />}
          <RegistryCheckLink serviceType={record.serviceType} />
          {method === "inspectionScan" && (
            <Field
              label="Километри · по избор"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="number-pad"
              placeholder="напр. 185000"
            />
          )}
          <Field
            label="Цена (€) · по избор"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            placeholder={
              formatCost(record.cost) ? `миналия път ${formatCost(record.cost)}` : "напр. 120"
            }
          />
          {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
          <PrimaryButton label="Запази новия срок" onPress={() => void save()} loading={saving} />
        </>
      )}

      <Pressable onPress={close} className="mt-4 items-center py-3">
        <Text className="text-sm text-dim">Още не съм подновил</Text>
      </Pressable>
      {letGo && (
        <Pressable onPress={confirmLetGo} className="items-center py-3">
          <Text className="text-sm text-status-expired">{letGo.title}</Text>
        </Pressable>
      )}
    </Screen>
  );
}
