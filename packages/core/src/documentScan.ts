/**
 * Document Scan — reading Vehicle and Service Record fields out of a photographed or uploaded
 * vehicle document. Pure, no I/O: OCR (or a PDF text layer) happens at the edge and hands the
 * text in here.
 *
 * First and only document in this module: the **Roadworthiness Inspection certificate**
 * (Удостоверение за техническа изправност на ППС). Its layout is fixed by regulation, so the
 * labels are stable across issuers and years — which is why it reads far more reliably than an
 * insurance policy. Other documents arrive as separate readers next to this one.
 *
 * Every field is optional. A Scan is a **suggestion the User confirms**, never a silent write —
 * OCR can fail on any line and the confirmation screen is what makes that safe.
 */

import { normalizePlate } from "./registryCheck";

// --- The QR code on the certificate -----------------------------------------------------

/** Host serving the official public check for an Inspection certificate. */
const RTA_CHECK_ORIGIN = "https://public-eis.rta.government.bg";
const RTA_CHECK_PATH = "/public-vehicle-check/certificate-check";

/**
 * A certificate number is the three values printed under the QR code, joined by dashes:
 * protocol number, verification code, station number — e.g. `117142271-C7C5C2D1E3B9-57`.
 */
const CERT_NUMBER = /\b(\d{6,12}-[0-9A-F]{8,16}-\d{1,4})\b/i;

/** A scanned Inspection certificate QR: what it identifies and where the User can open it. */
export interface CertificateRef {
  /** `<protocol>-<code>-<station>`, exactly as printed under the QR code. */
  certNumber: string;
  /** The official public check page for this certificate, for the User to open. */
  url: string;
}

/** The official public check link for a certificate number. */
export function certificateCheckUrl(certNumber: string): string {
  return `${RTA_CHECK_ORIGIN}${RTA_CHECK_PATH}?num=${encodeURIComponent(certNumber)}`;
}

/**
 * Read a scanned QR payload. Accepts the official check link or a bare certificate number
 * (readers differ in what they hand back). Returns null for any other code — a Vignette
 * receipt, a random sticker — so the caller can say "this is not an Inspection certificate".
 *
 * Nothing is fetched here: the link is **stored** so the User can open the full official check
 * themselves, in their own browser.
 */
export function parseCertificateQr(raw: string): CertificateRef | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  const trimmed = raw.trim();
  // A link only counts when it is the official check — a number inside any other URL is not one.
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes(RTA_CHECK_PATH)) return null;

  const certNumber = CERT_NUMBER.exec(trimmed)?.[1]?.toUpperCase();
  if (!certNumber) return null;

  return { certNumber, url: certificateCheckUrl(certNumber) };
}

// --- Dates ------------------------------------------------------------------------------

// Bulgarian documents write dates as `DD.MM.YYYY`; some (insurance policies) use dashes.
const DATE_ANYWHERE = /\b(\d{2})[.\-/](\d{2})[.\-/](\d{4})\b/g;

/** A date-only UTC Date from day/month/year parts, or null when the parts are not a real date. */
function utcDate(day: number, month: number, year: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? date : null;
}

/** Every `DD.MM.YYYY` date in `text`, in the order they appear. */
function allDates(text: string): Date[] {
  const dates: Date[] = [];
  for (const m of text.matchAll(DATE_ANYWHERE)) {
    const date = utcDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (date) dates.push(date);
  }
  return dates;
}

/** The first date appearing after `label` in `text`, or null. */
function dateAfter(text: string, label: RegExp): Date | null {
  const at = label.exec(text);
  if (!at) return null;
  const rest = text.slice(at.index + at[0].length, at.index + at[0].length + 60);
  return allDates(rest)[0] ?? null;
}

// --- Makes ------------------------------------------------------------------------------

/**
 * Cyrillic make names as printed on Bulgarian certificates → the canonical Latin name.
 * Ordered longest-first at match time, so "ЛЕНД РОВЕР" wins over a shorter prefix.
 */
const MAKES: Record<string, string> = {
  "АЛФА РОМЕО": "Alfa Romeo",
  АУДИ: "Audi",
  БМВ: "BMW",
  ВОЛВО: "Volvo",
  ДАЧИЯ: "Dacia",
  ДЖИП: "Jeep",
  КИА: "Kia",
  ЛАДА: "Lada",
  "ЛАНД РОВЕР": "Land Rover",
  "ЛЕНД РОВЕР": "Land Rover",
  ЛЕКСУС: "Lexus",
  МАЗДА: "Mazda",
  "МЕРЦЕДЕС БЕНЦ": "Mercedes-Benz",
  МЕРЦЕДЕС: "Mercedes-Benz",
  МИНИ: "Mini",
  МИЦУБИШИ: "Mitsubishi",
  НИСАН: "Nissan",
  ОПЕЛ: "Opel",
  ПЕЖО: "Peugeot",
  ПОРШЕ: "Porsche",
  РЕНО: "Renault",
  СЕАТ: "Seat",
  СИТРОЕН: "Citroën",
  СКОДА: "Škoda",
  СМАРТ: "Smart",
  СУБАРУ: "Subaru",
  СУЗУКИ: "Suzuki",
  ТОЙОТА: "Toyota",
  ФИАТ: "Fiat",
  ФОЛКСВАГЕН: "Volkswagen",
  ФОРД: "Ford",
  ХОНДА: "Honda",
  ХЮНДАЙ: "Hyundai",
  ШЕВРОЛЕТ: "Chevrolet",
  ШКОДА: "Škoda",
  ЯГУАР: "Jaguar",
};

const MAKES_LONGEST_FIRST = Object.keys(MAKES).sort((a, b) => b.length - a.length);

// The 12 Cyrillic letters that look like Latin ones, as used on plates and in model names.
const LOOKALIKE: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
};

/**
 * A model name in Latin **only when the whole string is already Latin look-alikes and digits**
 * ("А 6" → "A 6"). Anything with a letter that has no Latin twin ("ФРИЛАНДЕР") is left exactly
 * as printed — half-transliterating it would produce a mangled word nobody recognises.
 */
function latinizeModel(model: string): string {
  const letters = [...model].filter((ch) => /\p{L}/u.test(ch));
  if (letters.length > 0 && letters.every((ch) => ch in LOOKALIKE)) {
    return [...model].map((ch) => LOOKALIKE[ch] ?? ch).join("");
  }
  return model;
}

/** Split "АУДИ А 6" into a canonical make and the remaining model text. */
function splitMakeAndModel(raw: string): { brand: string | null; model: string | null } {
  let rest = raw.replace(/\s+/g, " ").trim().toUpperCase();
  let brand: string | null = null;

  // Strip make names off the front repeatedly — some certificates print the make twice
  // ("ЛЕНД РОВЕР ЛАНД РОВЕР ФРИЛАНДЕР 2").
  for (;;) {
    const hit = MAKES_LONGEST_FIRST.find(
      (name) => rest === name || rest.startsWith(`${name} `),
    );
    if (!hit) break;
    brand ??= MAKES[hit] ?? null;
    rest = rest.slice(hit.length).trim();
  }

  const model = rest === "" ? null : latinizeModel(rest);
  return { brand, model };
}

// --- Insurance policies (Civil Liability, Casco) -----------------------------------------

/** Fields read off an insurance policy. Any of them may be null. */
export interface PolicyScan {
  plate: string | null;
  vin: string | null;
  /** Start of the cover period. */
  startDate: Date | null;
  /** End of the cover period: the Service Record's Expiry Date. */
  expiryDate: Date | null;
  /** The amount actually due, in EUR. */
  cost: number | null;
}

// Where the cover period ends. Insurers differ, so each label gets its own anchor; the English
// halves of a bilingual policy are the most reliable, since OCR rarely mangles Latin.
const COVER_END = [
  /КРАЙ\s*:?\s*\d{2}:\d{2}\s*ч\.?\s*на\s*(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
  /unti?ll?\s+\d{2}:\d{2}\s*o'?clock\s+on\s*(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
  /до\s*\d{2}:\d{2}\s*часа\s*на[^\d]{0,40}(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
];

const COVER_START = [
  /НАЧАЛО\s*:?\s*\d{2}:\d{2}\s*ч\.?\s*на\s*(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
  /from\s+\d{2}:\d{2}\s*o'?clock\s+on\s*(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
  /от\s*\d{2}:\d{2}\s*часа\s*на[^\d]{0,40}(\d{2})[.\-/](\d{2})[.\-/](\d{4})/iu,
];

/** The first of `patterns` that matches, read as a date. */
function firstDateMatch(text: string, patterns: readonly RegExp[]): Date | null {
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    const date = m ? utcDate(Number(m[1]), Number(m[2]), Number(m[3])) : null;
    if (date) return date;
  }
  return null;
}

const YEAR_MS = 365 * 86_400_000;

/**
 * Both Civil Liability and Casco run for exactly one year, so a pair of dates roughly a year
 * apart identifies the cover period even with every label destroyed. Two days of slack absorbs
 * leap years and the "a year minus a day" way some insurers write it.
 */
function coverPairEnd(dates: readonly Date[]): Date | null {
  for (const start of dates) {
    for (const end of dates) {
      const gap = end.getTime() - start.getTime();
      if (Math.abs(gap - YEAR_MS) <= 2 * 86_400_000) return end;
    }
  }
  return null;
}

// Amounts are printed with the currency beside them, and Bulgaria prints both during the
// changeover ("393.38 EUR / 769.38 BGN"). Capture every pair so the euro one can be preferred.
const AMOUNT_WITH_CURRENCY = /(\d[\d\s]*[.,]\d{2})\s*(EUR|BGN|лв\.?|€)?/giu;
const TOTAL_DUE = /(?:дължима\s+сума|обща\s+сума|total\s+(?:sum|amount))/iu;

/**
 * The amount actually due. Deliberately anchored: a Casco policy also prints the sum the
 * Vehicle is insured for, which is far larger, so "the biggest number" would record a Cost
 * an order of magnitude wrong. With no labelled total, this stays null and the User types it.
 */
function readTotalDue(text: string): number | null {
  const at = TOTAL_DUE.exec(text);
  if (!at) return null;

  const span = text.slice(at.index, at.index + 120);
  const found: { value: number; currency: string }[] = [];
  for (const m of span.matchAll(AMOUNT_WITH_CURRENCY)) {
    const value = Number(m[1]?.replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(value)) found.push({ value, currency: (m[2] ?? "").toUpperCase() });
  }
  if (found.length === 0) return null;

  const euro = found.find((a) => a.currency === "EUR" || a.currency === "€");
  return (euro ?? found[0])?.value ?? null;
}

/**
 * Read an insurance policy — Civil Liability or Casco. Unlike the Inspection certificate, the
 * layout is the insurer's own, so this leans on labels that recur across them plus the
 * one-year-cover fallback, and leaves anything uncertain null for the User to fill in.
 */
export function readPolicy(text: string): PolicyScan {
  if (typeof text !== "string" || text.trim() === "") {
    return { plate: null, vin: null, startDate: null, expiryDate: null, cost: null };
  }

  const dates = allDates(text);
  const rawPlate = PLATE_LINE.exec(text)?.[1];

  return {
    plate: rawPlate ? normalizePlate(rawPlate) || null : null,
    vin: VIN.exec(text)?.[1] ?? null,
    startDate: firstDateMatch(text, COVER_START),
    expiryDate: firstDateMatch(text, COVER_END) ?? coverPairEnd(dates),
    cost: readTotalDue(text),
  };
}

// --- The certificate --------------------------------------------------------------------

/** Fields read off a Roadworthiness Inspection certificate. Any of them may be null. */
export interface InspectionScan {
  plate: string | null;
  vin: string | null;
  brand: string | null;
  model: string | null;
  /** Date of first registration — the whole statutory Inspection schedule follows from it. */
  firstRegistration: Date | null;
  /** The date this Inspection was carried out. */
  inspectionDate: Date | null;
  /** Valid-until date: the Service Record's Expiry Date. */
  expiryDate: Date | null;
  mileageKm: number | null;
}

const EMPTY: InspectionScan = {
  plate: null,
  vin: null,
  brand: null,
  model: null,
  firstRegistration: null,
  inspectionDate: null,
  expiryDate: null,
  mileageKm: null,
};

// A VIN is 17 characters, digits and Latin letters except I, O and Q.
const VIN = /\b([A-HJ-NPR-Z0-9]{17})\b/;
const PLATE_LINE = /Рег\.?\s*№\s*:?\s*([A-ZА-Я]{1,2}\s?\d{4}\s?[A-ZА-Я]{1,2})\b/iu;
const MODEL_LINE = /Марка\s*\/\s*Модел\s*:?\s*([^\n]+)/iu;

/**
 * Where the make/model value ends. The certificate prints in **two columns**, so the line that
 * carries the make also carries whatever sits to its right ("АУДИ А 6    Търговско наименование:").
 * The column gap is a run of spaces; when OCR collapses it, the neighbouring label still marks
 * the boundary.
 *
 * Note the `(?!\p{L})` tail rather than `\b`: JavaScript's word boundary is defined on ASCII
 * word characters only, so it never fires after a Cyrillic letter.
 */
const NEXT_COLUMN =
  /\s{2,}|\s+(?:Търговско|Двигател|Километропоказател|Вид|Цвят|Категория|ЕГН|Екологична|Собственик|Дата|Адрес|Разрешение|Протокол|Идент|Рег)(?!\p{L})/iu;
const MILEAGE = /Километропоказател\s*:?\s*([\d\s]+)\s*(?:km|км)/iu;

/**
 * Read a Roadworthiness Inspection certificate.
 *
 * The Expiry Date has an anchor found on no other line of the document — it is the date
 * followed by **"включително"**. When OCR mangles that Cyrillic label, the Expiry Date is still
 * recoverable without any label at all: on this certificate it is always the latest date
 * printed, so the fallback is simply the maximum.
 */
export function readInspectionCertificate(text: string): InspectionScan {
  if (typeof text !== "string" || text.trim() === "") return { ...EMPTY };

  const dates = allDates(text);

  // Preferred: the date immediately before "включително". Fallback: the latest date present.
  const inclusive = /(\d{2})[.\-/](\d{2})[.\-/](\d{4})\s*(?:г\.?)?\s*включително/iu.exec(text);
  const expiryDate =
    (inclusive && utcDate(Number(inclusive[1]), Number(inclusive[2]), Number(inclusive[3]))) ||
    (dates.length > 0
      ? dates.reduce((latest, d) => (d.getTime() > latest.getTime() ? d : latest))
      : null);

  const rawPlate = PLATE_LINE.exec(text)?.[1];
  const plate = rawPlate ? normalizePlate(rawPlate) || null : null;

  const vin = VIN.exec(text)?.[1] ?? null;

  const rawModel = MODEL_LINE.exec(text)?.[1];
  const { brand, model } = rawModel
    ? splitMakeAndModel(rawModel.split(NEXT_COLUMN)[0] ?? "")
    : { brand: null, model: null };

  const rawMileage = MILEAGE.exec(text)?.[1];
  const mileageKm = rawMileage ? Number(rawMileage.replace(/\s/g, "")) : null;

  return {
    plate,
    vin,
    brand,
    model,
    firstRegistration: dateAfter(text, /Дата\s+на\s+първа\s+регистрация\s*:?/iu),
    inspectionDate: dateAfter(text, /Прегледът\s+е\s+извършен\s+на\s*:?/iu),
    expiryDate,
    mileageKm: mileageKm != null && Number.isFinite(mileageKm) ? mileageKm : null,
  };
}
