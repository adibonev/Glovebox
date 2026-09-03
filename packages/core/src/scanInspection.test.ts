import { describe, expect, it } from "vitest";

import { certificateCheckUrl } from "./documentScan";
import { scanInspectionDocument } from "./scanDraft";

const CERTIFICATE_TEXT = `
УДОСТОВЕРЕНИЕ ЗА ТЕХНИЧЕСКА ИЗПРАВНОСТ НА ППС
(2) Рег. № EH9697KA                    (1) Идент. № (VIN, рама) WAUZZZ4G4CN031801
Марка / Модел: АУДИ А 6                Търговско наименование:
(4) Километропоказател: 369786 km
Дата на първа регистрация: 05.09.2011 г.
(3) Прегледът е извършен на: 17.08.2026 г.
(8) Подлежи на преглед до: 17.08.2027 г. включително
`;

const CERT_LINK =
  "https://public-eis.rta.government.bg/public-vehicle-check/certificate-check?num=117142271-C7C5C2D1E3B9-57";

describe("scanInspectionDocument", () => {
  it("turns one photographed certificate into a confirmable Vehicle and Service Record", () => {
    const draft = scanInspectionDocument({
      text: CERTIFICATE_TEXT,
      qrPayloads: [CERT_LINK],
    });

    expect(draft.vehicle).toEqual({
      brand: "Audi",
      model: "A 6",
      year: 2011,
      plate: "EH9697KA",
      vin: "WAUZZZ4G4CN031801",
    });
    expect(draft.serviceRecord).toEqual({
      serviceType: "inspection",
      expiryDate: new Date("2027-08-17"),
      cost: null,
    });
    expect(draft.certificateUrl).toBe(certificateCheckUrl("117142271-C7C5C2D1E3B9-57"));
  });

  it("still reads the document when the platform found no QR code", () => {
    // Certificates printed before the QR was introduced carry the same fields.
    const draft = scanInspectionDocument({ text: CERTIFICATE_TEXT });

    expect(draft.serviceRecord?.expiryDate).toEqual(new Date("2027-08-17"));
    expect(draft.certificateUrl).toBeNull();
  });

  it("picks the Inspection certificate out of several codes in the frame", () => {
    const draft = scanInspectionDocument({
      text: CERTIFICATE_TEXT,
      qrPayloads: ["https://example.com/promo", CERT_LINK, "9990001112223"],
    });

    expect(draft.certificateUrl).toBe(certificateCheckUrl("117142271-C7C5C2D1E3B9-57"));
  });

  it("ignores codes that are not Inspection certificates", () => {
    const draft = scanInspectionDocument({
      text: CERTIFICATE_TEXT,
      qrPayloads: ["https://example.com/promo"],
    });

    expect(draft.certificateUrl).toBeNull();
  });

  it("reports every field as missing when nothing could be read", () => {
    const draft = scanInspectionDocument({ text: "" });

    expect(draft.serviceRecord).toBeNull();
    expect(draft.vehicle).toEqual({
      brand: null,
      model: null,
      year: null,
      plate: null,
      vin: null,
    });
  });
});
