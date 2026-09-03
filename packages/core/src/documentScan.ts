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

// --- Finding a named field through OCR noise ---------------------------------------------

/**
 * The text reduced to letters and digits, with a map back to the original positions.
 *
 * Comparing in this form makes a label match survive the two things OCR does most: dropping or
 * inventing punctuation and spaces ("Рег. №" → "Рег Ne"), and splitting a line in the wrong place.
 */
function compact(text: string): { chars: string; positions: number[] } {
  let chars = "";
  const positions: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i).toUpperCase();
    // "№" is kept: it is what makes short labels like "Рег. №" distinctive enough to find.
    if (/[0-9A-ZА-Я№]/u.test(ch)) {
      chars += ch;
      positions.push(i);
    }
  }
  return { chars, positions };
}

/**
 * Put the numero sign back before anything is compared. Tesseract renders "№" as "Ne", "No" or
 * "N2", and those stray letters would otherwise sit inside a label and inside a value.
 */
function restoreNumero(text: string): string {
  return text.replace(/(?<![A-Za-z])N[eo2](?![A-Za-z])/g, "№");
}

/** Levenshtein distance, abandoned as soon as it cannot come in under `cap`. */
function editDistance(a: string, b: string, cap: number): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const value = Math.min(
        (previous[j] ?? Infinity) + 1,
        (current[j - 1] ?? Infinity) + 1,
        (previous[j - 1] ?? Infinity) + cost,
      );
      current.push(value);
      if (value < best) best = value;
    }
    if (best > cap) return cap + 1;
    previous = current;
  }
  return previous[b.length] ?? cap + 1;
}

/** How much of a label may be wrong before we stop believing we found it. */
const LABEL_ERROR_RATIO = 0.25;

/**
 * The position in `text` just past the field named `label`, or null when that field is not
 * legible. Approximate on purpose: OCR of Cyrillic gets a few characters wrong in almost every
 * label, and an exact match would silently drop the field — but the tolerance stays tight
 * enough that a *different* label never matches.
 */
function findFieldEnd(text: string, label: string): number | null {
  const needle = compact(label).chars;
  const { chars, positions } = compact(text);
  if (needle.length === 0 || chars.length < needle.length) return null;

  const cap = Math.floor(needle.length * LABEL_ERROR_RATIO);
  let bestAt = -1;
  let bestDistance = cap + 1;

  for (let i = 0; i + needle.length <= chars.length; i += 1) {
    const distance = editDistance(needle, chars.substr(i, needle.length), cap);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestAt = i;
      if (distance === 0) break;
    }
  }

  if (bestAt < 0 || bestDistance > cap) return null;
  // One past the last character the label consumed, in the original text.
  return (positions[bestAt + needle.length - 1] ?? text.length - 1) + 1;
}

/** The text of the field named `label`, up to `length` characters, or null. */
function valueInField(text: string, label: string, length = 60): string | null {
  const end = findFieldEnd(text, label);
  if (end === null) return null;
  // Whatever separates a label from its value — ":", ".", "№", spaces — is not part of it.
  return text.slice(end, end + length).replace(/^[\s:.,;)№-]+/u, "");
}

/** The first date printed in the field named `label`, or null when that field is not legible. */
function dateInField(text: string, label: string): Date | null {
  // A value sits right after its label; anything further away belongs to another field.
  const value = valueInField(text, label, 40);
  return value ? (allDates(value)[0] ?? null) : null;
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

/** Full Bulgarian → Latin transliteration, for model names with no Latin look-alike. */
const TRANSLITERATE: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ж: "ZH", З: "Z", И: "I",
  Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R", С: "S",
  Т: "T", У: "U", Ф: "F", Х: "H", Ц: "TS", Ч: "CH", Ш: "SH", Щ: "SHT",
  Ъ: "A", Ь: "Y", Ю: "YU", Я: "YA",
};

/**
 * Models whose Bulgarian spelling transliterates to something nobody would recognise.
 * Deliberately short — this is the table to grow from a real make/model catalogue.
 */
const MODEL_SPELLINGS: Record<string, string> = {
  ФРИЛАНДЕР: "Freelander",
  ДИСКЪВЪРИ: "Discovery",
  ОКТАВИЯ: "Octavia",
  ФАБИЯ: "Fabia",
  СУПЕРБ: "Superb",
  ПАСАТ: "Passat",
  ГОЛФ: "Golf",
  ТУАРЕГ: "Touareg",
  КОРСА: "Corsa",
  АСТРА: "Astra",
  ФОКУС: "Focus",
  ФИЕСТА: "Fiesta",
  МОНДЕО: "Mondeo",
  КОРОЛА: "Corolla",
  АВЕНСИС: "Avensis",
  ЯРИС: "Yaris",
};

/**
 * A model name **always in Latin**. The certificate prints it in Cyrillic, and a Cyrillic model
 * is useless for search and looks broken next to a Latin make.
 *
 * Three steps per word: a known spelling wins; a word made only of Latin look-alikes maps
 * straight across ("А 6" → "A 6"); anything left is transliterated, so nothing Cyrillic survives.
 */
function latinizeModel(model: string): string {
  return model
    .split(/\s+/)
    .filter((word) => word !== "")
    .map((word) => {
      const known = MODEL_SPELLINGS[word];
      if (known) return known;
      if ([...word].every((ch) => !/\p{L}/u.test(ch) || ch in LOOKALIKE)) {
        return [...word].map((ch) => LOOKALIKE[ch] ?? ch).join("");
      }
      return [...word].map((ch) => TRANSLITERATE[ch] ?? LOOKALIKE[ch] ?? ch).join("");
    })
    .join(" ");
}

/**
 * The catalogue entry `rest` begins with, allowing for OCR errors — "АУU А 6" is an Audi.
 *
 * Matching against a closed list of makes is a lookup, not a guess: either the reading is close
 * to a real make or it is close to none, and the tolerance stays under a third of the name so
 * two different makes can never be confused for one another.
 */
function matchMake(rest: string): string | undefined {
  const exact = MAKES_LONGEST_FIRST.find((name) => rest.startsWith(name));
  if (exact) return exact;

  return MAKES_LONGEST_FIRST.find((name) => {
    const cap = Math.floor(name.length / 3);
    return cap > 0 && editDistance(name, rest.slice(0, name.length), cap) <= cap;
  });
}

/** Split "АУДИ А 6" into a canonical make and the remaining model text. */
function splitMakeAndModel(raw: string): { brand: string | null; model: string | null } {
  let rest = raw.replace(/\s+/g, " ").trim().toUpperCase();
  let brand: string | null = null;

  // Strip make names off the front repeatedly — some certificates print the make twice
  // ("ЛЕНД РОВЕР ЛАНД РОВЕР ФРИЛАНДЕР 2").
  //
  // A bare prefix match, not "the name followed by a space": OCR routinely runs the make into
  // the model and hands back "АУДИА 6" for "АУДИ А 6". Longest-first ordering stops a longer
  // make being swallowed by a shorter one that prefixes it.
  for (;;) {
    const hit = matchMake(rest);
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

  const policyVin = firstValidVin(text);

  return {
    plate: rawPlate ? normalizePlate(rawPlate) || null : null,
    vin: policyVin ? repairVin(policyVin) : null,
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

/**
 * The numero sign as OCR really returns it. Tesseract almost never produces "№" from a scanned
 * certificate — it comes back as "Ne", "No" or "N2", which silently broke every anchor that
 * expected the character itself, and left "NE" sitting inside the model.
 */
const NUMERO = "(?:№|N[eo2₂])";

/**
 * A VIN is 17 characters. Matched permissively and repaired afterwards: the VIN alphabet
 * excludes I, O and Q *because* they look like 1 and 0, so any OCR hands back are really digits.
 */
const VIN_ALL = /(?<![A-Z0-9])([A-Z0-9]{17})(?![A-Z0-9])/g;

/** Bulgarian plate: one or two letters, four digits, one or two letters. */
const PLATE_SHAPE = "[A-ZА-Я]{1,2}\\s?\\d{4}\\s?[A-ZА-Я]{1,2}";
const PLATE_LINE = new RegExp(`Рег\\.?\\s*${NUMERO}?\\s*:?\\s*(${PLATE_SHAPE})`, "iu");
/** The same shape anywhere: nothing else on the certificate is written like a plate. */
const PLATE_ANYWHERE = new RegExp(`(?<![A-ZА-Я0-9])(${PLATE_SHAPE})(?![A-ZА-Я0-9])`, "u");

/**
 * The field names exactly as the certificate prints them.
 *
 * This form is prescribed by regulation and has no variants — every station in the country
 * issues the same layout with the same wording — so these are constants to recognise, not
 * guesses about what a document might say.
 */
const FIELDS = {
  plate: "Рег. №",
  vin: "Идент. № (VIN, рама)",
  model: "Марка / Модел",
  mileage: "Километропоказател",
  firstRegistration: "Дата на първа регистрация",
  inspectionDate: "Прегледът е извършен на",
  expiryDate: "Подлежи на преглед до",
} as const;

// ISO 3779: each character has a value, each position a weight, and the ninth character is the
// remainder of the weighted sum modulo 11 ("X" for 10).
const VIN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4,
  N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Whether a VIN's own check digit agrees with the rest of it.
 *
 * Worth checking because OCR reliably confuses 4 with A, 5 with S and 8 with B, and a VIN with
 * one character wrong looks exactly as convincing as a correct one. A failure is **not** proof
 * the reading is wrong — plenty of European VINs carry no meaningful check digit — but it is
 * good reason to ask the User to compare it against the document.
 *
 * Deliberately no auto-repair: substituting the confusable glyphs on a real misread VIN produced
 * *two* candidates that both satisfy the checksum, so picking one would be a coin toss.
 */
export function vinChecksumValid(vin: string): boolean {
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;

  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const ch = vin.charAt(i);
    const value = VIN_VALUES[ch] ?? Number(ch);
    sum += value * (VIN_WEIGHTS[i] ?? 0);
  }

  const remainder = sum % 11;
  return (remainder === 10 ? "X" : String(remainder)) === vin.charAt(8);
}

/** Repair an OCR'd VIN: I, O and Q cannot occur in one, so they are 1, 0 and 0. */
function repairVin(raw: string): string | null {
  const fixed = raw.replace(/I/g, "1").replace(/[OQ]/g, "0");
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(fixed) ? fixed : null;
}

/**
 * The first seventeen-character run that survives VIN repair. Scanning all candidates matters
 * when the page was recognised twice: the Bulgarian pass leaves a Cyrillic-contaminated version
 * that cannot be a VIN, and the English pass leaves the real one.
 */
function firstValidVin(text: string): string | undefined {
  for (const match of text.matchAll(VIN_ALL)) {
    const candidate = match[1];
    if (candidate && repairVin(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Where the make/model value ends. The certificate prints in **two columns**, so the line that
 * carries the make also carries whatever sits to its right ("АУДИ А 6    Търговско наименование:").
 * The column gap is a run of spaces; when OCR collapses it, the neighbouring label still marks
 * the boundary.
 *
 * Note the `(?!\p{L})` tail rather than `\b`: JavaScript's word boundary is defined on ASCII
 * word characters only, so it never fires after a Cyrillic letter.
 */
const NEXT_COLUMN = new RegExp(
  `\\s*\\(|\\s{2,}|\\s+${NUMERO}(?!\\p{L})` +
    `|\\s+(?:Търговско|Двигател|Километропоказател|Вид|Цвят|Категория|ЕГН|Екологична` +
    `|Собственик|Дата|Адрес|Разрешение|Протокол|Идент|Рег)(?!\\p{L})`,
  "iu",
);

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

  const source = restoreNumero(text);

  // The VIN and the plate are found by their format rather than by their label, and this is not
  // the same liberty as picking a date out of the air. A date is meaningless without the field
  // naming it — four of them sit on this certificate. A VIN is seventeen characters from an
  // alphabet chosen to be unambiguous, and a plate is one-or-two letters, four digits,
  // one-or-two letters: on this form exactly one string matches each, so the format *is* the
  // identification. It also survives the apps recognising the page twice, where the legible
  // copy sits in the English pass and its Bulgarian label in the other.
  const plateShape = PLATE_ANYWHERE.exec(source)?.[1];
  const rawVin = firstValidVin(source);

  const rawModel = valueInField(source, FIELDS.model, 60);

  const rawMileage = valueInField(source, FIELDS.mileage, 24)?.match(/([\d\s]{1,10})/)?.[1];
  const mileageKm = rawMileage?.trim() ? Number(rawMileage.replace(/\s/g, "")) : null;

  // The Expiry Date carries a second marker unique to that field: it is the only date on the
  // certificate followed by "включително".
  const inclusive = /(\d{2})[.\-/](\d{2})[.\-/](\d{4})\s*(?:г\.?)?\s*включително/iu.exec(source);

  return {
    plate: plateShape ? normalizePlate(plateShape) || null : null,
    vin: rawVin ? repairVin(rawVin) : null,
    ...(rawModel
      ? splitMakeAndModel(rawModel.split(NEXT_COLUMN)[0] ?? "")
      : { brand: null, model: null }),
    firstRegistration: dateInField(source, FIELDS.firstRegistration),
    inspectionDate: dateInField(source, FIELDS.inspectionDate),
    expiryDate:
      dateInField(source, FIELDS.expiryDate) ??
      (inclusive
        ? utcDate(Number(inclusive[1]), Number(inclusive[2]), Number(inclusive[3]))
        : null),
    mileageKm: mileageKm != null && Number.isFinite(mileageKm) ? mileageKm : null,
  };
}
