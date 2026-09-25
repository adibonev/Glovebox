import path from "node:path";

import type { VehiclePassport } from "@glovebox/core";
import { paper } from "@glovebox/ui";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import {
  PASSPORT_FOOTNOTE,
  PASSPORT_STATUS,
  PASSPORT_STATUS_ENDED,
  mileageSourceLabel,
  passportCost,
  passportDate,
  passportKm,
  serviceTypeLabel,
  vehicleFacts,
} from "../../../_lib/passport";

// The same faces as the site, as TTF files: a PDF has to carry its fonts, and these carry the
// Bulgarian Cyrillic. Kept in apps/web/assets/fonts (SIL Open Font License).
const FONTS = path.join(process.cwd(), "assets", "fonts");
Font.register({
  family: "Sofia Sans",
  fonts: [
    { src: path.join(FONTS, "SofiaSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "SofiaSans-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({ family: "Sofia Sans Condensed", src: path.join(FONTS, "SofiaSansCondensed-ExtraBold.ttf"), fontWeight: 800 });
Font.register({
  family: "JetBrains Mono",
  fonts: [
    { src: path.join(FONTS, "JetBrainsMono-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "JetBrainsMono-Bold.ttf"), fontWeight: 700 },
  ],
});
// The default hyphenation is English, and it cuts Bulgarian words in the wrong places.
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: {
    backgroundColor: paper.raised,
    color: paper.ink,
    fontFamily: "Sofia Sans",
    fontSize: 10,
    paddingHorizontal: 44,
    paddingTop: 40,
    // Room for the footer, which is pinned to the bottom of every page.
    paddingBottom: 150,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: paper.rule,
    paddingBottom: 10,
  },
  brand: { fontFamily: "Sofia Sans", fontWeight: 700, fontSize: 13 },
  eyebrow: { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 8, letterSpacing: 1.6, color: paper.copper },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 },
  title: { fontFamily: "Sofia Sans Condensed", fontWeight: 800, fontSize: 30 },
  facts: { marginTop: 4, color: paper.muted, fontSize: 11 },
  plate: {
    fontFamily: "JetBrains Mono",
    fontWeight: 700,
    fontSize: 13,
    borderWidth: 1.5,
    borderColor: paper.ink,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vin: { fontFamily: "JetBrains Mono", fontSize: 9, color: paper.muted, marginTop: 6 },
  section: { marginTop: 20 },
  sectionTitle: { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 8, letterSpacing: 1.6, color: paper.copper, marginBottom: 6 },
  rows: { borderTopWidth: 1, borderTopColor: paper.rule },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    borderBottomWidth: 1,
    borderBottomColor: paper.rule,
    paddingVertical: 5,
  },
  colDate: { width: 110, fontFamily: "JetBrains Mono", fontSize: 9.5 },
  colValue: { width: 110, fontFamily: "JetBrains Mono", fontSize: 9.5 },
  colNote: { flex: 1, fontSize: 9.5, color: paper.muted },
  obligationHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 },
  obligationName: { fontFamily: "Sofia Sans Condensed", fontWeight: 800, fontSize: 13 },
  status: { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 7.5, letterSpacing: 1 },
  warning: {
    borderWidth: 1,
    borderColor: paper.expired,
    color: paper.expired,
    padding: 8,
    marginBottom: 8,
    fontSize: 9.5,
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: paper.ink,
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 32,
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: paper.rule,
  },
  footnote: { flex: 1, fontSize: 8.5, color: paper.muted, lineHeight: 1.45 },
  qr: { width: 78, height: 78 },
  qrCaption: { fontFamily: "JetBrains Mono", fontSize: 6.5, color: paper.muted, marginTop: 3, width: 78, textAlign: "center" },
});

const STATUS_COLOR = {
  Valid: paper.valid,
  ExpiringSoon: paper.expiring,
  Expired: paper.expired,
} as const;

/** The Vehicle passport as a printable A4 document, with a QR code back to the live page. */
export function PassportDocument({
  passport,
  qrDataUrl,
  url,
}: {
  passport: VehiclePassport;
  qrDataUrl: string;
  url: string;
}) {
  const { vehicle, obligations, mileage, expenses, totalCost } = passport;
  const facts = vehicleFacts(vehicle);

  return (
    <Document
      title={`Паспорт на ${vehicle.brand} ${vehicle.model}`}
      author="Glovebox"
      language="bg"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>
            Glove<Text style={{ color: paper.copper }}>box</Text>
          </Text>
          <Text style={s.eyebrow}>ПАСПОРТ НА АВТОМОБИЛА</Text>
        </View>

        <View style={s.titleRow}>
          <View>
            <Text style={s.title}>
              {vehicle.brand} {vehicle.model}
            </Text>
            {facts ? <Text style={s.facts}>{facts}</Text> : null}
          </View>
          {vehicle.plate ? <Text style={s.plate}>{vehicle.plate}</Text> : null}
        </View>
        {vehicle.vin ? <Text style={s.vin}>Рама (VIN) {vehicle.vin}</Text> : null}

        <Section title="ПРОБЕГ">
          {mileage.readings.length === 0 ? (
            <Text style={s.colNote}>Няма записани километри.</Text>
          ) : (
            <>
              {mileage.rolledBack ? (
                <Text style={s.warning}>
                  Едно от отчитанията е по-ниско от предишно. Сверете го с удостоверенията за технически преглед.
                </Text>
              ) : null}
              <View style={s.rows}>
                {mileage.readings.map((reading) => (
                  <View key={reading.readOn.toISOString()} style={s.row} wrap={false}>
                    <Text style={s.colDate}>{passportDate(reading.readOn)}</Text>
                    <Text style={[s.colValue, { fontWeight: 700 }]}>{passportKm(reading.km)}</Text>
                    <Text style={[s.colNote, reading.source === "certificate" ? { color: paper.valid, fontWeight: 700 } : {}]}>
                      {mileageSourceLabel(reading.source)}
                    </Text>
                  </View>
                ))}
              </View>
              {mileage.kmPerYear != null ? (
                <Text style={[s.colNote, { marginTop: 5 }]}>Средно {passportKm(mileage.kmPerYear)} на година.</Text>
              ) : null}
            </>
          )}
        </Section>

        <Section title="СРОКОВЕ И ПОДНОВЯВАНИЯ">
          {obligations.length === 0 ? (
            <Text style={s.colNote}>Няма записани срокове.</Text>
          ) : (
            obligations.map((obligation) => (
              <View key={obligation.serviceType} wrap={false}>
                <View style={s.obligationHead}>
                  <Text style={s.obligationName}>{serviceTypeLabel(obligation.serviceType)}</Text>
                  <Text style={[s.status, { color: obligation.status ? STATUS_COLOR[obligation.status] : paper.muted }]}>
                    {(obligation.status ? PASSPORT_STATUS[obligation.status] : PASSPORT_STATUS_ENDED).toUpperCase()}
                  </Text>
                </View>
                <View style={[s.rows, { marginTop: 3 }]}>
                  {obligation.periods.map((period) => (
                    <View key={period.until.toISOString()} style={s.row}>
                      <Text style={[s.colDate, period.current ? { fontWeight: 700 } : {}]}>
                        до {passportDate(period.until)}
                      </Text>
                      <Text style={s.colValue}>{passportCost(period.cost) ?? ""}</Text>
                      <Text style={s.colNote}>{period.current ? "Текущ срок" : "Подновен"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </Section>

        {expenses.length > 0 ? (
          <Section title="РЕМОНТИ">
            <View style={s.rows}>
              {expenses.map((expense, i) => (
                <View key={`${expense.date.toISOString()}-${i}`} style={s.row} wrap={false}>
                  <Text style={s.colDate}>{passportDate(expense.date)}</Text>
                  <Text style={s.colValue}>{passportCost(expense.cost) ?? ""}</Text>
                  <Text style={s.colNote}>{serviceTypeLabel(expense.serviceType)}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {totalCost != null && totalCost > 0 ? (
          <View style={s.total} wrap={false}>
            <Text style={s.obligationName}>Общо записани разходи</Text>
            <Text style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 12 }}>{passportCost(totalCost)}</Text>
          </View>
        ) : null}

        {/* On every page, so any one page can be checked against the live passport. */}
        <View style={s.footer} fixed>
          <View style={{ flex: 1 }}>
            <Text style={s.footnote}>{PASSPORT_FOOTNOTE}</Text>
            <Text style={[s.footnote, { marginTop: 6, fontFamily: "JetBrains Mono" }]}>
              Към {passportDate(passport.generatedOn)} · {url}
            </Text>
          </View>
          <View>
            <Image src={qrDataUrl} style={s.qr} />
            <Text style={s.qrCaption}>ПРОВЕРИ ОНЛАЙН</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
