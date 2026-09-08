import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  canAddVehicle,
  missingVehicleFields,
  scanInspectionDocument,
  vinChecksumValid,
  type InspectionDraft,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { DocumentCamera } from "@/components/DocumentCamera";
import { DocumentReader, type DocumentReaderHandle } from "@/components/DocumentReader";
import { Field, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { getPlan } from "@/lib/plan";
import { supabase } from "@/lib/supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

/** Bulgarian names for the fields a scan can leave empty, in the order they are shown. */
const FIELD_NAMES: Record<string, string> = {
  brand: "марка",
  model: "модел",
  year: "година",
  plate: "рег. номер",
  vin: "рама",
};

/**
 * Add a Vehicle by photographing its Roadworthiness Inspection certificate.
 *
 * One page carries both the Vehicle and the Inspection that expires, so a single shot fills
 * them in together. Nothing is written from the reading alone: the User corrects it on the
 * confirmation form first, which is what makes recognition safe to rely on at all.
 */
export default function ScanVehicleScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const readerRef = useRef<DocumentReaderHandle | null>(null);

  const [stage, setStage] = useState<"camera" | "reading" | "confirm">("camera");
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable copies of what the scan proposed.
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [expiry, setExpiry] = useState("");

  const onCapture = async (dataUrl: string) => {
    setStage("reading");
    setProgress(0);
    try {
      const reader = readerRef.current;
      if (!reader) throw new Error("Разчитането още не е готово. Опитай пак след миг.");

      const text = await reader.read(dataUrl);
      const scanned = scanInspectionDocument({ text });

      setDraft(scanned);
      setBrand(scanned.vehicle.brand ?? "");
      setModel(scanned.vehicle.model ?? "");
      setYear(scanned.vehicle.year ? String(scanned.vehicle.year) : "");
      setPlate(scanned.vehicle.plate ?? "");
      setVin(scanned.vehicle.vin ?? "");
      setExpiry(scanned.serviceRecord ? isoDay(scanned.serviceRecord.expiryDate) : "");
      setNote(summarise(scanned));
      setStage("confirm");
    } catch (cause) {
      setNote(cause instanceof Error ? cause.message : "Разчитането не сработи.");
      setStage("confirm");
    }
  };

  const save = async () => {
    if (!session || !brand.trim() || !model.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const user = await userRepo.findOrCreateByAuthId({
        authUserId: session.user.id,
        email: session.user.email ?? "",
      });

      // Quota gate: Free is capped at 1 Vehicle (ADR-0003).
      const plan = await getPlan(user.id);
      const existing = await vehicleRepo.listByUser(user.id);
      if (!canAddVehicle(plan, existing.length)) {
        setError("Достигна лимита на Free (1 кола). Надгради до Pro от уеб приложението.");
        return;
      }

      const parsedYear = Number(year.trim());
      const vehicle = await vehicleRepo.create({
        userId: user.id,
        brand: brand.trim(),
        model: model.trim(),
        year: year.trim() && !Number.isNaN(parsedYear) ? parsedYear : null,
        plate: plate.trim() || null,
        vin: vin.trim().toUpperCase() || null,
        bodyType: "sedan",
      });

      // The Inspection is optional: without a readable Expiry Date the Vehicle is still worth
      // keeping, and the date gets added by hand.
      const expiryDate = expiry.trim() ? new Date(`${expiry.trim()}T00:00:00Z`) : null;
      if (expiryDate && !Number.isNaN(expiryDate.getTime())) {
        await serviceRepo.create({
          vehicleId: vehicle.id,
          userId: user.id,
          serviceType: "inspection",
          expiryDate,
        });
      }

      router.replace("/(tabs)/vehicles");
    } catch {
      setError("Колата не беше записана. Провери връзката и опитай пак.");
    } finally {
      setSaving(false);
    }
  };

  // The reader lives outside the stages: its WebView must stay mounted so the engine and its
  // language data are ready by the time a photo arrives, and stay cached afterwards.
  const reader = (
    <DocumentReader handleRef={readerRef} onProgress={setProgress} />
  );

  if (stage === "camera") {
    return (
      <View className="flex-1 bg-ink">
        {reader}
        <DocumentCamera onCapture={(url) => void onCapture(url)} onCancel={() => router.back()} />
      </View>
    );
  }

  if (stage === "reading") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-ink px-8">
        {reader}
        <ActivityIndicator color={colors.copper} />
        <Text className="text-center text-base text-silver">
          Разчитам документа на твоя телефон…
        </Text>
        <View className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <View
            style={{ width: `${Math.round(progress * 100)}%` }}
            className="h-full bg-copper"
          />
        </View>
        <Text className="text-center text-xs text-muted">
          Първия път се сваля езиковият пакет — после е бързо.
        </Text>
      </View>
    );
  }

  return (
    <Screen title="Провери данните">
      {reader}

      {note && (
        <View className="mb-4 rounded-xl border border-copper/40 bg-panel p-4">
          <Text className="text-sm text-silver">{note}</Text>
        </View>
      )}

      <Field label="Марка" value={brand} onChangeText={setBrand} placeholder="напр. Audi" />
      <Field label="Модел" value={model} onChangeText={setModel} placeholder="напр. A6" />
      <Field
        label="Година"
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholder="напр. 2011"
      />
      <Field label="Рег. номер" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
      <Field
        label="VIN / рама"
        value={vin}
        onChangeText={setVin}
        autoCapitalize="characters"
        maxLength={17}
      />

      {/* A VIN carries its own check digit, and recognition reliably turns 4 into A, 5 into S
          and 8 into B. One wrong character reads as convincingly as a correct one. */}
      {vin.trim().length === 17 && !vinChecksumValid(vin.trim().toUpperCase()) && (
        <Text className="-mt-2 mb-4 text-xs text-status-expiring">
          Сверѝ рамата знак по знак — контролната ѝ цифра не излиза. Разчитането обърква 4 с A,
          5 с S и 8 с B.
        </Text>
      )}

      <Field
        label="Преглед валиден до (ГГГГ-ММ-ДД)"
        value={expiry}
        onChangeText={setExpiry}
        placeholder="напр. 2027-08-17"
      />

      {draft?.certificateUrl && (
        <Text className="mb-4 text-xs text-muted">
          Пълната официална справка за този протокол е запазена към прегледа.
        </Text>
      )}

      {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}

      <PrimaryButton label="Запази колата" onPress={() => void save()} loading={saving} />
    </Screen>
  );
}

/** `YYYY-MM-DD` for a date. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** What to tell the User: naming the empty fields beats "не успях да разчета документа". */
function summarise(draft: InspectionDraft): string | null {
  const missing = missingVehicleFields(draft.vehicle).map((field) => FIELD_NAMES[field] ?? field);
  if (!draft.serviceRecord) missing.unshift("срокът на прегледа");
  if (missing.length === 0) return null;

  const tail = draft.serviceRecord
    ? ""
    : " Срокът е на последния ред на удостоверението — ако не е влязъл в кадъра, снимай пак с целия долен ред.";
  return `Разчетох част от данните. Допълни ръчно: ${missing.join(", ")}.${tail}`;
}
