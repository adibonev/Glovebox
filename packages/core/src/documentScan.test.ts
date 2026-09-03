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
    // Left exactly as printed: "ФРИЛАНДЕР" carries Cyrillic letters with no Latin look-alike,
    // so transliterating it would produce a mangled half-Latin word. The User edits it instead.
    expect(scan.model).toBe("ФРИЛАНДЕР 2");
    expect(scan.expiryDate).toEqual(new Date("2023-10-27"));
    expect(scan.firstRegistration).toEqual(new Date("2002-09-16"));
    expect(scan.mileageKm).toBe(15631);
  });

  it("still finds the Expiry Date when OCR mangles the Cyrillic label", () => {
    // Worst case: every label is unreadable, only the dates survive. The Expiry Date is the
    // latest date on the certificate, so it is recoverable without any label at all.
    const mangled = `
      YAOCTOBEPEHNE 3A TEXHNYECKA N3NPABHOCT
      ... 05.09.2011 ... 17.08.2026 ... 17.08.2027 ...
    `;

    expect(readInspectionCertificate(mangled).expiryDate).toEqual(new Date("2027-08-17"));
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
