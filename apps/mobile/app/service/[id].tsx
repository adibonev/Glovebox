import { Ionicons } from "@expo/vector-icons";
import {
  DOCUMENT_SCAN_ENABLED,
  SupabaseDocumentRepository,
  SupabaseMileageReadingRepository,
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  daysUntil,
  expiryStatus,
  isExpiringServiceType,
  mileageSource,
  scanInspectionDocument,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, Text, TextInput, View } from "react-native";

import { DocumentCamera } from "@/components/DocumentCamera";
import { ChipPicker, DangerButton, DateField, Field, PrimaryButton, VignettePresets } from "@/components/forms";
import { RegistryCheckLink } from "@/components/RegistryCheckLink";
import { Screen } from "@/components/Screen";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { deleteDocument, pickDocument, signedUrls, uploadDocument } from "@/lib/documents";
import { DELETE_FAILED, deleteServiceRecord } from "@/lib/erasure";
import { dataChanged, useLoadWhenStale } from "@/lib/freshness";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ORDER,
  STATUS_COLORS,
  STATUS_LABELS,
  formatCost,
  formatRecordSummary,
  parseCost,
} from "@/lib/labels";
import { parseKm, todayAsDate } from "@/lib/mileage";
import { recordOwner } from "@/lib/ownership";
import { useDocumentRecognition } from "@/lib/recognize";
import { DEFAULT_WINDOW } from "@/lib/reminderSettings";
import { supabase } from "@/lib/supabase";
import { useGarage } from "@/lib/useGarage";

const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const documentRepo = new SupabaseDocumentRepository(supabase);
const mileageRepo = new SupabaseMileageReadingRepository(supabase);
const TYPE_OPTIONS = SERVICE_TYPE_ORDER.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }));

type DocItem = { id: string; name: string; path: string; url: string | null; isImage: boolean };

/**
 * One Service Record, everything about it in one place, as on the website: when it runs out,
 * renewing it, its Documents, a note, fixing a mistake, deleting it. Every list in the app leads
 * here. Renewing has its own screen (/renew/[id]), which keeps the old period in the passport.
 */
export default function ServiceRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gone, setGone] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const found = await serviceRepo.getById(id);
      if (!found) {
        setGone(true);
        return;
      }
      const [owner, docs] = await Promise.all([
        vehicleRepo.getById(found.vehicleId),
        documentRepo.listByServiceRecord(found.id),
      ]);
      const urls = await signedUrls(docs.map((d) => d.path));
      setRecord(found);
      setNotes(found.notes ?? "");
      setVehicle(owner);
      setDocuments(
        docs.map((d) => ({
          id: d.id,
          name: d.name,
          path: d.path,
          url: urls.get(d.path) ?? null,
          isImage: (d.mimeType ?? "").startsWith("image/"),
        })),
      );
    } catch {
      setError("Срокът не се зареди. Провери връзката и опитай пак.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const reload = useLoadWhenStale(load);
  // The status is judged with the User's own Reminder Window, as on the dashboard.
  const { data: garage } = useGarage();

  if (loading || gone || !record) {
    return (
      <Screen title="Срок">
        <View className="mt-10 items-center">
          {loading ? (
            <ActivityIndicator color={colors.copper} />
          ) : (
            <Text className="text-center text-base text-muted">{error ?? "Този срок вече не съществува."}</Text>
          )}
        </View>
      </Screen>
    );
  }

  const label = SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType;
  const expiring = isExpiringServiceType(record.serviceType);
  const today = todayAsDate();
  const days = daysUntil(record.expiryDate, today);
  const window = garage?.windowFor(record.serviceType) ?? DEFAULT_WINDOW;
  const status = expiring ? expiryStatus(record, window, today) : null;
  const cost = formatCost(record.cost);
  const noteUnchanged = notes.trim() === (record.notes ?? "").trim();

  const attach = async () => {
    if (!session || uploading) return;
    const file = await pickDocument();
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(session.user.id, record.id, file);
      await reload();
    } catch {
      Alert.alert("Документът не се качи", "Провери връзката и опитай пак.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (doc: DocItem) => {
    Alert.alert(`Да изтрия ли „${doc.name}“?`, undefined, [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: () => {
          deleteDocument(doc.id, doc.path)
            .then(reload)
            .catch(() => Alert.alert("Документът не е изтрит", DELETE_FAILED));
        },
      },
    ]);
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await serviceRepo.update(record.id, { notes: notes.trim() || null });
      dataChanged();
      Alert.alert("Бележката е запазена.");
    } catch {
      Alert.alert("Бележката не е запазена", "Провери връзката и опитай пак.");
    } finally {
      setSavingNote(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(`Да изтрия ли „${label}“?`, "Изтриват се и документите към този срок.", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: () => {
          deleteServiceRecord(record.id)
            .then(() => router.back())
            .catch(() => setError(DELETE_FAILED));
        },
      },
    ]);
  };

  return (
    <Screen title={label}>
      {vehicle && (
        <Text className="-mt-4 mb-2 text-sm text-muted">
          {vehicle.brand} {vehicle.model}
          {vehicle.plate ? ` · ${vehicle.plate}` : ""}
        </Text>
      )}
      <View className="mb-5 flex-row flex-wrap items-center gap-2">
        {status && status !== "Valid" && (
          <View className="rounded-md px-2 py-1" style={{ backgroundColor: `${STATUS_COLORS[status]}1f` }}>
            <Text className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: STATUS_COLORS[status] }}>
              {STATUS_LABELS[status]}
            </Text>
          </View>
        )}
        <Text className="text-base text-silver">
          {formatRecordSummary({ expiring, expiryDate: record.expiryDate, days })}
          {cost ? <Text className="text-copper"> · {cost}</Text> : null}
        </Text>
      </View>

      {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}

      {expiring && (
        <View className="mb-5">
          <PrimaryButton label="Поднови" onPress={() => router.push(`/renew/${record.id}`)} />
          <Text className="-mt-1 text-center text-xs text-dim">Платил си за нов период? Старият се пази в паспорта.</Text>
        </View>
      )}

      <Card
        title="Документи"
        action={
          <Pressable onPress={() => void attach()} hitSlop={8} className="flex-row items-center gap-1" disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.copper} />
            ) : (
              <Ionicons name="add" size={16} color={colors.copper} />
            )}
            <Text className="text-sm font-semibold text-copper">Прикачи</Text>
          </Pressable>
        }
      >
        {documents.length === 0 ? (
          <Text className="text-sm text-dim">Качи полицата или бележката за плащане, за да са ти под ръка.</Text>
        ) : (
          <View className="gap-2">
            {documents.map((doc) => (
              <View key={doc.id} className="flex-row items-center gap-2 rounded-xl border border-white/10 bg-ink2 px-3 py-2.5">
                <Ionicons name={doc.isImage ? "image-outline" : "document-text-outline"} size={18} color={colors.copper} />
                <Pressable className="flex-1" onPress={() => doc.url && void Linking.openURL(doc.url)}>
                  <Text numberOfLines={1} className="text-sm text-silver">
                    {doc.name}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => removeDocument(doc)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Изтрий ${doc.name}`}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.dim} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card title="Бележка">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Застраховател, номер на полицата, сервиз…"
          placeholderTextColor={colors.dim}
          className="min-h-[80px] rounded-xl border border-white/10 bg-ink2 px-4 py-3 text-base text-ivory"
          style={{ textAlignVertical: "top" }}
        />
        <Pressable
          onPress={() => void saveNote()}
          disabled={savingNote || noteUnchanged}
          className={`mt-3 self-start rounded-xl border border-white/15 px-4 py-2.5 ${noteUnchanged ? "opacity-40" : ""}`}
        >
          <Text className="text-sm font-semibold text-ivory">{savingNote ? "Записване…" : "Запази бележката"}</Text>
        </Pressable>
      </Card>

      <Pressable
        onPress={() => setCorrecting((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: correcting }}
        className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-panel px-4 py-4"
      >
        <View>
          <Text className="text-base font-semibold text-ivory">Поправи данните</Text>
          <Text className="text-xs text-muted">грешна дата, цена или вид</Text>
        </View>
        <Ionicons name={correcting ? "chevron-up" : "chevron-down"} size={18} color={colors.silver} />
      </Pressable>
      {correcting && (
        <CorrectForm
          record={record}
          vehicleId={record.vehicleId}
          onSaved={() => {
            setCorrecting(false);
            void reload();
          }}
        />
      )}

      <View className="mt-4">
        <DangerButton label="Изтрий срока" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ivory">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

/**
 * Fixing what was entered wrong: the date, the price, the kind, and for an Inspection the
 * kilometres, which can be read off the certificate. Not a renewal: a new period belongs on the
 * renewal screen, so that the old one is kept.
 */
function CorrectForm({ record, vehicleId, onSaved }: { record: ServiceRecord; vehicleId: string; onSaved: () => void }) {
  const { session } = useAuth();
  const { recognize, reader, engineLabel } = useDocumentRecognition();
  const [stage, setStage] = useState<"form" | "camera" | "reading">("form");
  const [serviceType, setServiceType] = useState<string | null>(record.serviceType);
  const [expiryDate, setExpiryDate] = useState<Date>(record.expiryDate);
  const [cost, setCost] = useState(record.cost != null ? String(record.cost).replace(".", ",") : "");
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

  /** A certificate carries both the Expiry Date and what the odometer showed on the day. */
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
          : "Срокът не се разчете. Въведи го ръчно.",
      );
      track(draft.serviceRecord ? "scan_succeeded" : "scan_failed", { document: "inspection", screen: "edit" });
    } catch {
      track("scan_failed", { document: "inspection", screen: "edit" });
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
      await serviceRepo.update(record.id, { serviceType, expiryDate, cost: parseCost(cost) });
      dataChanged();
    } catch {
      setError("Промените не са записани. Провери връзката и опитай пак.");
      setSaving(false);
      return;
    }

    const km = inspection ? parseKm(mileage) : null;
    if (km !== null && session) {
      try {
        await mileageRepo.record({
          vehicleId,
          // The owner's, also when a family member edits a shared car.
          userId: await recordOwner(vehicleId),
          km,
          readOn: mileageReadOn ?? todayAsDate(),
          source: mileageSource(km, kmRead),
        });
        dataChanged();
      } catch {
        // The Expiry Date is saved by now; say so, rather than suggest that nothing was.
        setError("Срокът е записан, но километрите не. Опитай пак.");
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <View className="mb-2 rounded-2xl border border-white/10 bg-panel p-4">
      {reader}
      {/* The camera takes the whole screen, as it does everywhere else in the app. */}
      <Modal visible={stage === "camera"} animationType="slide" onRequestClose={() => setStage("form")}>
        <View className="flex-1 bg-ink">
          <DocumentCamera onCapture={(url) => void readCertificate(url)} onCancel={() => setStage("form")} />
        </View>
      </Modal>
      {stage === "reading" && (
        <View className="mb-4 flex-row items-center gap-3">
          <ActivityIndicator color={colors.copper} />
          <Text className="text-sm text-silver">Разчитам документа…</Text>
        </View>
      )}
      {inspection && DOCUMENT_SCAN_ENABLED && (
        <Pressable
          onPress={() => {
            track("scan_started", { document: "inspection", screen: "edit" });
            setStage("camera");
          }}
          className="mb-4 rounded-xl border border-copper/60 bg-copper/15 p-4"
        >
          <Text className="text-base font-semibold text-ivory">Снимай талона</Text>
          <Text className="mt-1 text-sm leading-5 text-silver">Срокът и километрите се попълват сами.</Text>
        </Pressable>
      )}
      {note && (
        <View className="mb-4 rounded-xl border border-copper/40 bg-ink2 p-3">
          <Text className="text-sm leading-5 text-silver">{note}</Text>
        </View>
      )}
      <DateField label={expiring ? "В сила до" : "Дата на разхода"} value={expiryDate} onChange={setExpiryDate} />
      {serviceType === "vignette" && <VignettePresets value={expiryDate} onPick={setExpiryDate} />}
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
      <Field label="Цена (€) · по избор" value={cost} onChangeText={setCost} placeholder="напр. 120" keyboardType="decimal-pad" />
      <ChipPicker label="Вид" value={serviceType} options={TYPE_OPTIONS} onChange={setServiceType} />
      {error && <Text className="mb-2 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази промените" onPress={() => void save()} loading={saving} disabled={!serviceType} />
    </View>
  );
}
