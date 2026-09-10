import { describe, expect, it } from "vitest";

import { readPolicy } from "./documentScan";
import { scanPolicyDocument } from "./scanDraft";

// A real Casco policy (ДЗИ, 2026) — clean laser print, bilingual labels absent, dual currency.
const DZI_CASCO = `
"ДЗИ – Общо застраховане" ЕАД · 1463 гр. София, бул. „Витоша" № 89Б · ЕИК: 121718407
АВТОМОБИЛНА ЗАСТРАХОВКА „КАСКО+" ЗАСТРАХОВАТЕЛНА ПОЛИЦА № 4700026051001444
СРОК НА ЗАСТРАХОВКАТА 1 година
ПЕРИОД НА ЗАСТРАХОВАТЕЛНО ПОКРИТИЕ
НАЧАЛО: 00:00 ч. на 14.05.2026 г.        КРАЙ: 23:59 ч. на 13.05.2027 г.
ОБЕКТ НА ЗАСТРАХОВКАТА    РЕГ. №: EH9697KA
МАРКА: АУДИ      РАМА №: WAUZZZ4G4CN031801
МОДЕЛ: A 6       ВИД МПС: Автомобил
ДАТА НА ПЪРВА РЕГИСТРАЦИЯ: 05-09-2011 г.
ЗАСТРАХОВАТЕЛНА СУМА НА МПС: 10500.00 EUR      ЗАСТР. ПРЕМИЯ: 378.00 EUR
ОБЩО ДЪЛЖИМА СУМА        393.38 EUR / 769.38 BGN
ДАТА НА ПАДЕЖ: 14.05.2026 г.
`;

// A real Civil Liability policy (ДаллБогг, 2017) — a photocopy with bilingual labels.
const DALLBOGG_MTPL = `
ЗАД ДаллБогг: Живот и Здраве АД  ЕИК/UIC 200299615
Застрахователна полица / Insurance policy № BG/30/117000182705
валидност/ valid от 11:59 часа на/ from 11:59 o'clock on 05.01.2017
до 24:00 часа на/ untill 24:00 o'clock on 05.01.2018
Гражданска отговорност на автомобилистите/Motor Third Party Liability
Рег № B8974BC   Марка/Make SEAT   Модел/Model Alhambra
Рама №/Frame No VSSZZZ7MZ2V513470
Застрахователна премия/Premium 163.97
Общо дължима сума/Total sum 162.10
`;

// The same ДЗИ Casco as a top-to-bottom reading returns it. ДЗИ prints each figure flush right
// and a little above its label, so the figure comes out first and the line after the total's
// label is the payment line with the due date — which is how a real scan recorded the due date
// as the Cost. Only labels, dates and figures are kept; the people on the policy are not.
const DZI_CASCO_AS_READ = `
АВТОМОБИЛНА ЗАСТРАХОВКА „КАСКО+" ЗАСТРАХОВАТЕЛНА ПОЛИЦА
КРАЙ: 23:59 ч. на 13.05.2027 г.
СРОК НА ЗАСТРАХОВКАТА 1 година
НАЧАЛО: 00:00 ч. на 14.05.2026 г.
ПЕРИОД НА ЗАСТРАХОВАТЕЛНО ПОКРИТИЕ
378.00 EUR
ЗАСТРАХОВАТЕЛНА СУМА НА МПС: 10500.00 EUR
ЗАСТР. ПРЕМИЯ:
7.67 EUR
ЗАСТР. ПРЕМИЯ:
7.67 EUR
ЗАСТР. ПРЕМИЯ (ОБЩО):
385.67 EUR
ОБЩО ДЪЛЖИМА ЗАСТРАХОВАТЕЛНА ПРЕМИЯ ПО ПОЛИЦАТА
7.71 EUR
ОБЩО ДЪЛЖИМ ДАНЪК ВЪРХУ ЗАСТРАХОВАТЕЛНИТЕ ПРЕМИИ 2%
393.38 EUR / 769.38 BGN
ОБЩО ДЪЛЖИМА СУМА
ПЛАЩАНЕ: Банков превод
НАЧИН НА ПЛАЩАНЕ: Еднократно
ДАТА НА ПАДЕЖ: 14.05.2026 г.
`;

// A real ДЗИ Civil Liability policy (2026), read the same way and kept to the same fields.
const DZI_MTPL_AS_READ = `
КОМБИНИРАНА ЗАСТРАХОВАТЕЛНА ПОЛИЦА
КРАЙ: 23:59 ч. на 11.08.2027 г.
СРОК НА ЗАСТРАХОВКАТА 1 година
ЗАСТРАХОВАТЕЛЕН ПЕРИОД / ПОКРИТИЕ НАЧАЛО: 00:00 ч. на 12.08.2026 г.
ЗАСТРАХОВКА „ГРАЖДАНСКА ОТГОВОРНОСТ" НА АВТОМОБИЛИСТИТЕ
272.74 EUR
БАЗОВА ПРЕМИЯ:
-35.2 %
ОТСТЪПКА:
0 %
НАДБАВКА:
181.15 EUR
ПРЕМИЯ:
181.15 EUR
ОБЩО ДЪЛЖИМА ЗАСТРАХОВАТЕЛНА ПРЕМИЯ
3.62 EUR
ДАНЪК ВЪРХУ ЗАСТРАХОВАТЕЛНАТА ПРЕМИЯ 2%
8.50 EUR
ВНОСКИ, СЪГЛАСНО КЗ ПО ГО НА АВТОМОБИЛИСТИТЕ (вноска за ГФ – 6.50 EUR, за ОФ 2.00 EUR)
193.27 EUR / 378.00 BGN
ОБЩО ДЪЛЖИМА СУМА
ПЛАЩАНЕ: Банков превод
НАЧИН НА ПЛАЩАНЕ: Еднократно
ДАТА НА ПАДЕЖ: 12.08.2026 г.
`;

describe("readPolicy, when each figure comes out apart from its label", () => {
  it("reads the total printed just above its label", () => {
    expect(readPolicy(DZI_CASCO_AS_READ).cost).toBe(393.38);
  });

  it("turns a Civil Liability policy read that way into a Service Record at the right Cost", () => {
    expect(scanPolicyDocument({ text: DZI_MTPL_AS_READ }, "civil_liability").serviceRecord).toEqual({
      serviceType: "civil_liability",
      expiryDate: new Date("2027-08-11"),
      cost: 193.27,
    });
  });
});

describe("readPolicy", () => {
  it("reads the Expiry Date from the end of the cover period", () => {
    expect(readPolicy(DZI_CASCO).expiryDate).toEqual(new Date("2027-05-13"));
  });

  it("reads the start of the cover period", () => {
    expect(readPolicy(DZI_CASCO).startDate).toEqual(new Date("2026-05-14"));
  });

  it("reads the plate and the VIN off the policy", () => {
    const scan = readPolicy(DZI_CASCO);

    expect(scan.plate).toBe("EH9697KA");
    expect(scan.vin).toBe("WAUZZZ4G4CN031801");
  });

  it("takes the amount actually due, not the sum the Vehicle is insured for", () => {
    // The largest figure on the page is the insured value (10500.00) — taking the biggest
    // number would record a Cost twenty-six times too high.
    expect(readPolicy(DZI_CASCO).cost).toBe(393.38);
  });

  it("prefers the euro amount when the total is printed in both currencies", () => {
    expect(readPolicy(DZI_CASCO).cost).not.toBe(769.38);
  });

  it("reads a policy from another insurer, off its English label", () => {
    const scan = readPolicy(DALLBOGG_MTPL);

    expect(scan.expiryDate).toEqual(new Date("2018-01-05"));
    expect(scan.startDate).toEqual(new Date("2017-01-05"));
    expect(scan.plate).toBe("B8974BC");
    expect(scan.vin).toBe("VSSZZZ7MZ2V513470");
    expect(scan.cost).toBe(162.1);
  });

  it("falls back to the later of two dates a year apart when every label is unreadable", () => {
    // Civil Liability and Casco both run for exactly one year, so the pair identifies itself.
    const mangled = "3aCTpaxOBaTeAHa noAnLa ... 14.05.2026 ... 13.05.2027 ... 05-09-2011 ...";

    expect(readPolicy(mangled).expiryDate).toEqual(new Date("2027-05-13"));
  });

  it("leaves the Cost null rather than guessing when no total is labelled", () => {
    expect(readPolicy("Полица от 14.05.2026 до 13.05.2027. Премия 378.00 EUR").cost).toBeNull();
  });

  it("never reads the due date under the total as the amount due", () => {
    // The payment date is printed right under the total, so it is the first number a reading
    // reaches after the label — and "14.05.2026" holds a perfectly amount-shaped "14.05".
    expect(readPolicy("ОБЩО ДЪЛЖИМА СУМА\nДАТА НА ПАДЕЖ: 14.05.2026 г.").cost).toBeNull();
  });

  it("returns nulls rather than throwing for text that is not a policy", () => {
    expect(readPolicy("списък за пазаруване")).toEqual({
      plate: null,
      vin: null,
      startDate: null,
      expiryDate: null,
      cost: null,
    });
  });
});

describe("scanPolicyDocument", () => {
  it("turns a Casco policy into a Service Record of that type", () => {
    const draft = scanPolicyDocument({ text: DZI_CASCO }, "casco");

    expect(draft.serviceRecord).toEqual({
      serviceType: "casco",
      expiryDate: new Date("2027-05-13"),
      cost: 393.38,
    });
  });

  it("carries the plate and VIN printed on the policy", () => {
    // The caller checks these against the Vehicle: a policy for another car is the one mistake
    // a User cannot spot on a confirmation form, because every date on it looks right.
    const draft = scanPolicyDocument({ text: DALLBOGG_MTPL }, "civil_liability");

    expect(draft.insuredVehicle.plate).toBeTruthy();
  });

  it("proposes no Service Record when no Expiry Date could be read", () => {
    const draft = scanPolicyDocument({ text: "списък за пазаруване" }, "casco");

    expect(draft.serviceRecord).toBeNull();
  });
});
