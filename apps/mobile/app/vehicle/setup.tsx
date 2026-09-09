import {
  DOCUMENT_SCAN_ENABLED,
  SCANNABLE_SERVICE_TYPES,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  canAddVehicle,
  missingVehicleFields,
  onboardingGaps,
  scanInspectionDocument,
  scanPolicyDocument,
  suggestVinCorrection,
  vinChecksumValid,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { DocumentCamera } from "@/components/DocumentCamera";
import { ChipPicker, DateField, Field, PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { BODY_TYPES, BODY_TYPE_LABELS } from "@/lib/bodyType";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { getPlan } from "@/lib/plan";
import { parseCost } from "@/lib/cost";
import { useDocumentRecognition } from "@/lib/recognize";
import { supabase } from "@/lib/supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

/**
 * Adding a Vehicle, from an empty account to a car with its obligations recorded.
 *
 * One journey rather than a set of buttons. A driver does not think "I will now add a Service
 * Record of type Civil Liability" — they think "I just got the car into the app, what does it
 * need?", and the answer is the same list every time, in the same order.
 *
 * The Vehicle is written as soon as its own fields are confirmed, and each obligation as it is
 * confirmed after that. Someone who closes the app on the fifth step keeps everything up to the
 * fourth, and every step can be left for later, because most people do not carry all six
 * documents at once.
 */

type Stage =
  | "bodyType"
  | "vehicleSource"
  | "vehicleCamera"
  | "vehicleConfirm"
  | "serviceChoice"
  | "serviceCamera"
  | "serviceForm";

/** A year ahead: what most of these obligations run for, and a date the User adjusts anyway. */
function inOneYear(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

const scannable = (serviceType: string): boolean =>
  DOCUMENT_SCAN_ENABLED && (SCANNABLE_SERVICE_TYPES as readonly string[]).includes(serviceType);

export default function VehicleSetupScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { recognize, reader, progress, reportsProgress, engineLabel } = useDocumentRecognition();

  const [stage, setStage] = useState<Stage>("bodyType");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // The Vehicle.
  const [bodyType, setBodyType] = useState("sedan");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // The obligations still to ask about, and the one being asked about now.
  const [remaining, setRemaining] = useState<string[]>([]);
  /** Read off the certificate; null when it could not be read, and then simply not recorded. */
  const [inspectionExpiry, setInspectionExpiry] = useState<Date | null>(null);
  const [expiry, setExpiry] = useState<Date>(inOneYear);
  const [cost, setCost] = useState("");

  const serviceType = remaining[0];
  const vinSuggestion = suggestVinCorrection(vin.trim().toUpperCase());

  const fail = (message: string) => {
    setError(message);
    setBusy(false);
  };

  // ---- the Vehicle -------------------------------------------------------------------------

  const readCertificate = async (dataUrl: string) => {
    setStage("vehicleConfirm");
    setBusy(true);
    try {
      const scanned = scanInspectionDocument({ text: await recognize(dataUrl) });
      setBrand(scanned.vehicle.brand ?? "");
      setModel(scanned.vehicle.model ?? "");
      setYear(scanned.vehicle.year ? String(scanned.vehicle.year) : "");
      setPlate(scanned.vehicle.plate ?? "");
      setVin(scanned.vehicle.vin ?? "");
      // The certificate carries the Inspection itself, so that obligation is already answered.
      if (scanned.serviceRecord) setInspectionExpiry(scanned.serviceRecord.expiryDate);
      const missing = missingVehicleFields(scanned.vehicle);
      setNote(missing.length ? "Част от данните не се разчетоха — допълни ги." : null);
    } catch {
      setNote("Разчитането не сработи. Попълни данните ръчно.");
    } finally {
      setBusy(false);
    }
  };

  const saveVehicle = async () => {
    if (!session || !brand.trim() || !model.trim()) return;
    setBusy(true);
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
        return fail("Достигна лимита на Free (1 кола). Надгради до Pro от уеб приложението.");
      }

      const parsedYear = Number(year.trim());
      const vehicle = await vehicleRepo.create({
        userId: user.id,
        brand: brand.trim(),
        model: model.trim(),
        year: year.trim() && !Number.isNaN(parsedYear) ? parsedYear : null,
        plate: plate.trim() || null,
        vin: vin.trim().toUpperCase() || null,
        bodyType,
      });
      setVehicleId(vehicle.id);

      // The Inspection came off the certificate; record it before asking for anything else.
      const recorded: string[] = [];
      if (inspectionExpiry) {
        await serviceRepo.create({
          vehicleId: vehicle.id,
          userId: user.id,
          serviceType: "inspection",
          expiryDate: inspectionExpiry,
        });
        recorded.push("inspection");
      }

      setRemaining(
        onboardingGaps({ brand: null, model: null, year: null, plate: null, vin: null }, recorded)
          .serviceTypes,
      );
      setExpiry(inOneYear());
      setNote(null);
      setStage("serviceChoice");
    } catch {
      fail("Колата не беше записана. Провери връзката и опитай пак.");
    } finally {
      setBusy(false);
    }
  };

  // ---- one obligation ----------------------------------------------------------------------

  const readPolicyPhoto = async (dataUrl: string) => {
    if (!serviceType) return;
    setStage("serviceForm");
    setBusy(true);
    try {
      const draft = scanPolicyDocument(
        { text: await recognize(dataUrl) },
        serviceType as "civil_liability" | "casco",
      );
      if (draft.serviceRecord) setExpiry(draft.serviceRecord.expiryDate);
      setCost(draft.serviceRecord?.cost != null ? String(draft.serviceRecord.cost) : "");

      // A policy written for another car is the one error a confirmation form cannot show.
      const insured = draft.insuredVehicle.plate;
      setNote(
        insured && plate.trim() && insured !== plate.trim().toUpperCase()
          ? `Внимание: полицата е за ${insured}, а колата е ${plate.trim().toUpperCase()}.`
          : draft.serviceRecord
            ? null
            : "Срокът не се разчете — въведи го ръчно.",
      );
    } catch {
      setNote("Разчитането не сработи. Въведи данните ръчно.");
    } finally {
      setBusy(false);
    }
  };

  const nextService = (recordedType?: string) => {
    const left = remaining.filter((type) => type !== (recordedType ?? serviceType));
    setRemaining(left);
    setExpiry(inOneYear());
    setCost("");
    setNote(null);
    setStage(left.length ? "serviceChoice" : "serviceForm");
    if (!left.length) finish();
  };

  const saveService = async () => {
    if (!session || !vehicleId || !serviceType) return;
    setBusy(true);
    setError(null);
    try {
      const user = await userRepo.findOrCreateByAuthId({
        authUserId: session.user.id,
        email: session.user.email ?? "",
      });
      await serviceRepo.create({
        vehicleId,
        userId: user.id,
        serviceType,
        expiryDate: expiry,
        cost: parseCost(cost),
      });
      nextService(serviceType);
    } catch {
      fail("Услугата не беше записана. Опитай пак.");
    } finally {
      setBusy(false);
    }
  };

  /** The journey ends where the User decides when to be told — the point of recording any of it. */
  const finish = () => router.replace("/(tabs)/reminders");

  // ---- screens -----------------------------------------------------------------------------

  if (stage === "vehicleCamera" || stage === "serviceCamera") {
    const onCapture = stage === "vehicleCamera" ? readCertificate : readPolicyPhoto;
    return (
      <View className="flex-1 bg-ink">
        {reader}
        <DocumentCamera
          onCapture={(url) => void onCapture(url)}
          onCancel={() => setStage(stage === "vehicleCamera" ? "vehicleSource" : "serviceChoice")}
        />
      </View>
    );
  }

  if (busy && (stage === "vehicleConfirm" || stage === "serviceForm") && !brand && !note) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-ink px-8">
        {reader}
        <ActivityIndicator color={colors.copper} />
        <Text className="text-center text-base text-silver">Разчитам документа…</Text>
        {reportsProgress && (
          <View className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <View style={{ width: `${Math.round(progress * 100)}%` }} className="h-full bg-copper" />
          </View>
        )}
      </View>
    );
  }

  if (stage === "bodyType") {
    return (
      <Screen title="Добре дошъл в Glovebox">
        {reader}
        <Text className="mb-6 text-base leading-6 text-silver">
          Добави първия си автомобил. Ще те преведа през документите му един по един — каквото
          нямаш подръка, оставяш за после.
        </Text>
        <ChipPicker
          label="Каросерия"
          value={bodyType}
          options={BODY_TYPES.map((type) => ({ value: type, label: BODY_TYPE_LABELS[type] }))}
          onChange={setBodyType}
        />
        <PrimaryButton label="Напред" onPress={() => setStage("vehicleSource")} />
      </Screen>
    );
  }

  if (stage === "vehicleSource") {
    return (
      <Screen title="Данните за колата">
        {reader}
        <Text className="mb-6 text-base leading-6 text-silver">
          Талонът от техническия преглед носи всичко наведнъж — марка, модел, номер, рама и
          срока на прегледа.
        </Text>
        {DOCUMENT_SCAN_ENABLED && (
          <Choice
            title="Снимай талона за технически преглед"
            body="Данните се попълват сами, а ти ги проверяваш."
            tone="copper"
            onPress={() => setStage("vehicleCamera")}
          />
        )}
        <Choice
          title="Въведи ръчно"
          body="Попълваш полетата сам. Работи без документ подръка."
          tone="emerald"
          onPress={() => setStage("vehicleConfirm")}
        />
      </Screen>
    );
  }

  if (stage === "vehicleConfirm") {
    return (
      <Screen title="Провери данните">
        {reader}
        {note && <Notice>{note}</Notice>}
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
        {vin.trim().length === 17 && !vinChecksumValid(vin.trim().toUpperCase()) && (
          <View className="-mt-2 mb-4 gap-2">
            <Text className="text-xs text-status-expiring">
              Сверѝ рамата — контролната ѝ цифра не излиза.
            </Text>
            {vinSuggestion && (
              <Pressable
                onPress={() => setVin(vinSuggestion)}
                className="self-start rounded-lg border border-copper/50 bg-copper/10 px-3 py-2"
              >
                <Text className="text-xs text-copper">
                  Може би <Text className="font-semibold">{vinSuggestion}</Text> — докосни, за да
                  я използваш
                </Text>
              </Pressable>
            )}
          </View>
        )}
        {inspectionExpiry && (
          <Text className="mb-4 text-xs text-muted">
            Разчетено с {engineLabel}. Срокът на прегледа се записва заедно с колата.
          </Text>
        )}
        {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}
        <PrimaryButton
          label="Запази и продължи"
          onPress={() => void saveVehicle()}
          loading={busy}
          disabled={!brand.trim() || !model.trim()}
        />
      </Screen>
    );
  }

  if (!serviceType) {
    return (
      <Screen title="Готово">
        <Text className="mb-6 text-base text-silver">Колата е добавена.</Text>
        <PrimaryButton label="Към напомнянията" onPress={finish} />
      </Screen>
    );
  }

  const label = SERVICE_TYPE_LABELS[serviceType] ?? serviceType;

  if (stage === "serviceChoice") {
    return (
      <Screen title={label}>
        {reader}
        <Text className="mb-6 text-base leading-6 text-silver">
          {serviceType === "civil_liability"
            ? "Гражданската отговорност е задължителна за всяка кола."
            : serviceType === "casco"
              ? "Имаш ли каско за тази кола?"
              : `Кога изтича ${label.toLowerCase()}?`}
        </Text>
        {scannable(serviceType) && (
          <Choice
            title="Снимай полицата"
            body="Срокът и премията се попълват сами."
            tone="copper"
            onPress={() => setStage("serviceCamera")}
          />
        )}
        <Choice
          title="Въведи ръчно"
          body="Избираш датата сам."
          tone="emerald"
          onPress={() => setStage("serviceForm")}
        />
        <Pressable onPress={() => nextService()} className="mt-5 items-center py-3">
          <Text className="text-sm text-dim">Добави по-късно</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={label}>
      {reader}
      {note && <Notice>{note}</Notice>}
      <DateField label="Валидна до" value={expiry} onChange={setExpiry} />
      <Field
        label="Цена (€) · по избор"
        value={cost}
        onChangeText={setCost}
        keyboardType="decimal-pad"
        placeholder="напр. 245"
      />
      {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}
      <PrimaryButton label="Запази и продължи" onPress={() => void saveService()} loading={busy} />
      <Pressable onPress={() => nextService()} className="mt-2 items-center py-3">
        <Text className="text-sm text-dim">Добави по-късно</Text>
      </Pressable>
    </Screen>
  );
}

function Choice({
  title,
  body,
  tone,
  onPress,
}: {
  title: string;
  body: string;
  tone: "copper" | "emerald";
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 rounded-2xl border p-5 ${
        tone === "copper" ? "border-copper/60 bg-copper/15" : "border-emerald/60 bg-emerald/15"
      }`}
    >
      <Text className="text-lg font-semibold text-ivory">{title}</Text>
      <Text className="mt-1.5 text-sm leading-5 text-silver">{body}</Text>
    </Pressable>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-4 rounded-xl border border-copper/40 bg-panel p-4">
      <Text className="text-sm leading-5 text-silver">{children}</Text>
    </View>
  );
}
