import { describe, expect, it } from "vitest";

import { certificateCheckUrl, parseCertificateQr, readInspectionCertificate } from "./documentScan";

// The OCR text of a real Roadworthiness Inspection certificate (Audi A6, 2026). Field order
// follows the printed layout, which is fixed by regulation.
const AUDI_CERTIFICATE = `
УДОСТОВЕРЕНИЕ ЗА ТЕХНИЧЕСКА ИЗПРАВНОСТ НА ППС
Протокол №: 43685703   Разрешение №: 1985 / 1   Начало: 17.08.2026 17:24
(2) Рег. № EH9697KA                    (1) Идент. № (VIN, рама) WAUZZZ4G4CN031801
Марка / Модел: АУДИ А 6                Търговско наименование:
Двигател № CDU026033                   (4) Километропоказател: 369786 km
Цвят: ЧЕРЕН МЕТАЛИК                    Вид/Тип на двигателя: ДИЗЕЛ
Дата на първа регистрация: 05.09.2011 г.   (5) Категория ППС: M1
Собственик: АДАЛБЕРТ АНТОНОВ БОНЕВ     ЕГН/БУЛСТАТ/ЕИК: 9904031729
(3) Адрес на КТП: гр. София, бул. Симеоновско шосе №89В
Екологична категория: ЕВРО 5А
(7) ТЕХНИЧЕСКАТА ИЗПРАВНОСТ НА ППС ДОПУСКА ДА СЕ ДВИЖИ ПО ПЪТИЩАТА
117142271  57  C7C5C2D1E3B9
МПС се определя към Четвърта (4) екологична група.
(3) Прегледът е извършен на: 17.08.2026 г.
(8) Подлежи на преглед до: 17.08.2027 г. включително
`;

// A second real certificate (Land Rover Freelander 2, 2022) — an older printing of the same form.
const LAND_ROVER_CERTIFICATE = `
УДОСТОВЕРЕНИЕ ЗА ТЕХНИЧЕСКА ИЗПРАВНОСТ НА ППС
Протокол №: 30280672   Разрешение №: 1093 / 1   Начало: 27.10.2022 13:51
(2) Рег. № CO1452CP                    (1) Идент. № (VIN, рама) SALLNAAE82A202202
Марка / Модел: ЛЕНД РОВЕР ЛАНД РОВЕР ФРИЛАНДЕР 2
Двигател № 204D382445039               (4) Километропоказател: 15631 km
Цвят: СИВ                              Вид/Тип на двигателя: ДИЗЕЛ
Дата на първа регистрация: 16.09.2002 г.   (5) Категория ППС: M1G
Собственик: РАДОСЛАВ ИВАНОВ РАНГЕЛОВ
Екологична категория: ЕВРО 3
(3) Прегледът е извършен на: 27.10.2022 г.
(8) Подлежи на преглед до: 27.10.2023 г. включително
`;

describe("parseCertificateQr", () => {
  it("reads the certificate number out of the official check link", () => {
    const ref = parseCertificateQr(
      "https://public-eis.rta.government.bg/public-vehicle-check/certificate-check?num=117142271-C7C5C2D1E3B9-57",
    );

    expect(ref?.certNumber).toBe("117142271-C7C5C2D1E3B9-57");
  });

  it("keeps a link the User can open to see the full official check", () => {
    const ref = parseCertificateQr(
      "https://public-eis.rta.government.bg/public-vehicle-check/certificate-check?num=117142271-C7C5C2D1E3B9-57",
    );

    expect(ref?.url).toBe(certificateCheckUrl("117142271-C7C5C2D1E3B9-57"));
  });

  it("accepts a bare certificate number, since some readers hand back only the payload", () => {
    expect(parseCertificateQr("117142271-C7C5C2D1E3B9-57")?.certNumber).toBe(
      "117142271-C7C5C2D1E3B9-57",
    );
  });

  it("returns null for a code that is not a Roadworthiness Inspection certificate", () => {
    expect(parseCertificateQr("https://example.com/hello")).toBeNull();
    expect(parseCertificateQr("")).toBeNull();
  });
});

describe("readInspectionCertificate", () => {
  it("reads the Expiry Date from the line marked 'включително'", () => {
    expect(readInspectionCertificate(AUDI_CERTIFICATE).expiryDate).toEqual(
      new Date("2027-08-17"),
    );
  });

  it("reads the date of first registration, which drives every future Inspection", () => {
    expect(readInspectionCertificate(AUDI_CERTIFICATE).firstRegistration).toEqual(
      new Date("2011-09-05"),
    );
  });

  it("reads the registration plate and the VIN", () => {
    const scan = readInspectionCertificate(AUDI_CERTIFICATE);

    expect(scan.plate).toBe("EH9697KA");
    expect(scan.vin).toBe("WAUZZZ4G4CN031801");
  });

  it("maps the Cyrillic make to its canonical Latin name and keeps the rest as the model", () => {
    const scan = readInspectionCertificate(AUDI_CERTIFICATE);

    expect(scan.brand).toBe("Audi");
    // "А 6" is written in Cyrillic look-alikes only, so it transliterates cleanly to Latin.
    expect(scan.model).toBe("A 6");
  });

  it("stops the model at the neighbouring column even when OCR collapses the gap", () => {
    // The certificate prints in two columns; OCR often returns them as one line with a single
    // space, so the label to the right must not end up inside the model.
    const collapsed = "Марка / Модел: АУДИ А 6 Търговско наименование:\n";

    expect(readInspectionCertificate(collapsed).model).toBe("A 6");
  });

  it("reads the odometer reading", () => {
    expect(readInspectionCertificate(AUDI_CERTIFICATE).mileageKm).toBe(369786);
  });

  it("reads the date the Inspection was carried out", () => {
    expect(readInspectionCertificate(AUDI_CERTIFICATE).inspectionDate).toEqual(
      new Date("2026-08-17"),
    );
  });

  it("reads a second certificate whose make is printed twice", () => {
    const scan = readInspectionCertificate(LAND_ROVER_CERTIFICATE);

    expect(scan.plate).toBe("CO1452CP");
    expect(scan.vin).toBe("SALLNAAE82A202202");
    expect(scan.brand).toBe("Land Rover");
    expect(scan.model).toBe("Freelander 2");
    expect(scan.expiryDate).toEqual(new Date("2023-10-27"));
    expect(scan.firstRegistration).toEqual(new Date("2002-09-16"));
    expect(scan.mileageKm).toBe(15631);
  });

  it("reports no Expiry Date when OCR destroyed the field naming it", () => {
    // Every label transliterated into Latin gibberish. Nothing here names a field, so nothing
    // is read — an empty box the User fills beats a confident wrong date.
    const mangled = `
      YAOCTOBEPEHNE 3A TEXHNYECKA N3NPABHOCT
      ... 05.09.2011 ... 17.08.2026 ... 17.08.2027 ...
    `;

    expect(readInspectionCertificate(mangled).expiryDate).toBeNull();
  });

  it("refuses to pass off the Inspection date as the Expiry Date", () => {
    // Real failure: a photo that cut off the bottom line left only the date the Inspection was
    // carried out. Falling back to "the latest date" then filled 17.08.2026 — plausible, wrong,
    // and a year early. Better to report nothing and let the User type it.
    const bottomCropped = `
      УДОСТОВЕРЕНИЕ ЗА ТЕХНИЧЕСКА ИЗПРАВНОСТ НА ППС
      Дата на първа регистрация: 05.09.2011 г.
      (3) Прегледът е извършен на: 17.08.2026 г.
    `;

    expect(readInspectionCertificate(bottomCropped).expiryDate).toBeNull();
  });

  it("reads the make even when OCR runs it into the model", () => {
    // Real OCR output: "АУДИ А 6" came back as "АУДИА 6", and the neighbouring column bled in.
    const noisy = "Марка / Модел: АУДИА 6 А (VIN, REL WA | 'AK\n";
    const scan = readInspectionCertificate(noisy);

    expect(scan.brand).toBe("Audi");
    expect(scan.model).not.toContain("VIN");
  });

  it("always returns the model in Latin letters, never Cyrillic", () => {
    const scan = readInspectionCertificate("Марка / Модел: ЛЕНД РОВЕР ФРИЛАНДЕР 2\n");

    expect(scan.brand).toBe("Land Rover");
    expect(scan.model).toBe("Freelander 2");
  });

  it("transliterates a model it does not recognise rather than leaving it Cyrillic", () => {
    const scan = readInspectionCertificate("Марка / Модел: ШКОДА КОДИЯК\n");

    expect(scan.brand).toBe("Škoda");
    expect(scan.model).toBe("KODIYAK");
  });

  it("returns nulls rather than throwing when the text is not a certificate at all", () => {
    const scan = readInspectionCertificate("някакъв съвсем друг документ");

    expect(scan).toEqual({
      plate: null,
      vin: null,
      brand: null,
      model: null,
      firstRegistration: null,
      inspectionDate: null,
      expiryDate: null,
      mileageKm: null,
    });
  });
});

// What Tesseract actually returns for the Audi certificate: "№" comes back as "Ne", the make
// runs into the model, and one VIN digit is misread. Kept verbatim — this is the shape of the
// noise the reader has to survive.
const NOISY_OCR = `
УДОСТОВЕРЕНИЕ ЗА ТЕХНИЧЕСКА ИЗПРАВНОСТ НА ППС
Протокол Ne: 43685703   Разрешение Ne: 1985 / 1   Начало: 17.08.2026 17:24
(2) Рег. Ne EH9697KA    (1) Идент. Ne (VIN, рама) WAUZZZ4G4CN031801
Марка / Модел: АУДИА 6 NE   Търговско наименование:
Двигател Ne CDU026033   (4) Километропоказател: 369786 km
Дата на първа регистрация: 05.09.2011 г.
17.08.2027 г. включително
`;

describe("readInspectionCertificate — real OCR noise", () => {
  it("reads the plate although '№' came back as 'Ne'", () => {
    expect(readInspectionCertificate(NOISY_OCR).plate).toBe("EH9697KA");
  });

  it("keeps the misread '№' out of the model", () => {
    expect(readInspectionCertificate(NOISY_OCR).model).toBe("A 6");
  });

  it("reads the date of first registration, and the year with it", () => {
    expect(readInspectionCertificate(NOISY_OCR).firstRegistration).toEqual(
      new Date("2011-09-05"),
    );
  });

  it("reads a label through OCR errors in it", () => {
    // "Дата на първа регистрация" with three characters wrong — well inside what a scan of a
    // Cyrillic document produces, and still unambiguously that field.
    const misread = "Дата ня първа регнстрацяя: 05.09.2011 г.";

    expect(readInspectionCertificate(misread).firstRegistration).toEqual(new Date("2011-09-05"));
  });

  it("reads the Expiry Date from its own named field", () => {
    const labelled = "(8) Подлежи на преглед до: 17.08.2027 г. включително";

    expect(readInspectionCertificate(labelled).expiryDate).toEqual(new Date("2027-08-17"));
  });

  it("takes no value at all when no field names it", () => {
    // Bare dates with nothing naming them. Guessing which is the Expiry Date — by taking the
    // latest, or by looking for a statutory gap — is how a plausible wrong date gets saved.
    const unlabelled = "... 05.09.2011 ... 17.08.2026 ... 17.08.2027 ...";
    const scan = readInspectionCertificate(unlabelled);

    expect(scan.expiryDate).toBeNull();
    expect(scan.firstRegistration).toBeNull();
  });

  it("takes no plate when nothing names it, however plate-shaped the text looks", () => {
    const unlabelled = "УДОСТОВЕРЕНИЕ\n... EH9697KA ... 43685703 ...";

    expect(readInspectionCertificate(unlabelled).plate).toBeNull();
  });

  it("does not confuse the Inspection date with the Expiry Date", () => {
    // A photo that cut off the bottom line leaves only the date the Inspection happened.
    const cropped = "(3) Прегледът е извършен на: 17.08.2026 г.";
    const scan = readInspectionCertificate(cropped);

    expect(scan.inspectionDate).toEqual(new Date("2026-08-17"));
    expect(scan.expiryDate).toBeNull();
  });

  it("normalises letters a VIN cannot contain", () => {
    // I, O and Q are excluded from the VIN alphabet precisely because they look like 1 and 0,
    // so any that OCR produces are certainly digits.
    const withLookalikes = "Идент. Ne (VIN, рама) WAUZZZ4G4CNO318O1";

    expect(readInspectionCertificate(withLookalikes).vin).toBe("WAUZZZ4G4CN031801");
  });
});

