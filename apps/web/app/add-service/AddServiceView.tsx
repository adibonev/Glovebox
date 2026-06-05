"use client";

import { isExpiringServiceType, type CheckResult, type ExtractedServiceInfo } from "@glovebox/core";
import Link from "next/link";
import { useRef, useState } from "react";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { addService } from "../_lib/actions";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AddServiceView({
  vehicleId,
  plate = null,
  aiEnabled = false,
}: {
  vehicleId: string;
  plate?: string | null;
  aiEnabled?: boolean;
}) {
  const [type, setType] = useState(TYPES[0] ?? "civil_liability");
  const [expiryDate, setExpiryDate] = useState(todayIso());
  const [cost, setCost] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);
  const [regMsg, setRegMsg] = useState<string | null>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const expiring = isExpiringServiceType(type);

  // Registry Check (ГТП): ask the registry by plate and PREFILL the date — the User confirms by
  // saving (same confirm pattern as the AI prefill; never an automatic write).
  async function checkInspection() {
    if (!plate) return;
    setRegBusy(true);
    setRegMsg(null);
    try {
      const res = await fetch("/api/registry-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate, serviceType: "inspection" }),
      });
      if (!res.ok) {
        setRegMsg("Проверката не успя — попълни ръчно.");
        return;
      }
      const data = (await res.json()) as CheckResult;
      if (data.expiryDate) {
        setExpiryDate(data.expiryDate);
        setRegMsg(`Регистърът сочи валидност до ${data.expiryDate} — провери и потвърди.`);
      } else {
        setRegMsg("Регистърът още не върна дата — попълни ръчно.");
      }
    } catch {
      setRegMsg("Грешка при проверката — попълни ръчно.");
    } finally {
      setRegBusy(false);
    }
  }

  async function extractFromDocument(file: File) {
    setAiBusy(true);
    setAiMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      if (res.status === 503) {
        setAiMsg("AI разчитането още не е настроено.");
        return;
      }
      if (!res.ok) {
        setAiMsg("Не успях да разчета документа — попълни ръчно.");
        return;
      }
      const data = (await res.json()) as ExtractedServiceInfo;
      let filled = 0;
      if (data.serviceType) {
        setType(data.serviceType);
        filled++;
      }
      if (data.expiryDate) {
        setExpiryDate(data.expiryDate);
        filled++;
      }
      if (data.cost != null) {
        setCost(String(data.cost));
        filled++;
      }
      setAiMsg(
        filled > 0
          ? `Попълних ${filled} ${filled === 1 ? "поле" : "полета"} — провери ги, преди да запазиш.`
          : "Не открих данни в документа — попълни ръчно.",
      );
    } catch {
      setAiMsg("Грешка при разчитането — попълни ръчно.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <form action={addService} className="flex flex-col gap-7">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="serviceType" value={type} />

      {/* AI prefill: snap the policy / талон and the dates fill in. */}
      {aiEnabled ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-copper/30 bg-copper/[0.06] p-4">
          <input
            ref={docInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void extractFromDocument(file);
            }}
          />
          <button
            type="button"
            onClick={() => docInput.current?.click()}
            disabled={aiBusy}
            className="flex items-center justify-center gap-2 rounded-xl bg-copper/90 px-4 py-2.5 font-body text-sm font-semibold text-ink transition hover:bg-copper disabled:opacity-60"
          >
            {aiBusy ? "Разчитам документа…" : "📄 Попълни от снимка на документа"}
          </button>
          <p className="font-body text-[12px] text-silver/60">
            {aiMsg ?? "Снимай ГО полицата / талона — попълваме вида и датата вместо теб (ти потвърждаваш)."}
          </p>
        </div>
      ) : (
        // "Coming soon" teaser while the AI extractor isn't configured yet.
        <div className="flex items-center gap-3 rounded-2xl border border-copper/20 bg-copper/[0.05] p-4">
          <span className="text-xl" aria-hidden>
            📄
          </span>
          <div className="flex flex-col">
            <span className="flex items-center gap-2 font-body text-sm font-semibold text-ivory">
              Попълване от снимка на документа
              <span className="rounded-full border border-copper/40 bg-copper/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-copper">
                Очаквайте скоро
              </span>
            </span>
            <span className="font-body text-[12px] text-silver/60">
              Снимай ГО полицата / талона — AI ще попълва вида и датите вместо теб.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Вид услуга
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TYPES.map((code) => {
            const active = type === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setType(code)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                  active
                    ? "border-copper bg-copper/10 text-ivory"
                    : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
                }`}
              >
                <ServiceTypeIcon type={code} className="h-7 w-7" />
                <span className="font-body text-[13px] leading-tight">
                  {SERVICE_TYPE_LABELS[code]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Registry Check (ГТП) — auto-check validity by plate and prefill the date (confirm pattern). */}
      {type === "inspection" && plate && (
        <div className="flex flex-col gap-2 rounded-2xl border border-copper/30 bg-copper/[0.06] p-4">
          <button
            type="button"
            onClick={checkInspection}
            disabled={regBusy}
            className="flex items-center justify-center gap-2 rounded-xl border border-copper/50 px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:bg-copper/10 disabled:opacity-60"
          >
            {regBusy ? "Проверявам в регистъра…" : "🛡️ Провери ГТП по рег. номер"}
          </button>
          <p className="font-body text-[12px] text-silver/60">
            {regMsg ?? `Проверка в Автомобилна администрация по ${plate} — попълваме датата, ти потвърждаваш.`}
          </p>
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          {expiring ? "Дата на изтичане" : "Дата на разход"}
        </span>
        <input
          type="date"
          name="expiryDate"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
          className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Цена (€) · по избор
        </span>
        <input
          type="number"
          name="cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="напр. 120"
          className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Документ · по избор
        </span>
        <input
          type="file"
          name="document"
          accept="application/pdf,image/*"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-ink/60 py-2 pl-2 pr-4 font-body text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ivory hover:file:bg-emerald/90 focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Бележка · по избор
        </span>
        <textarea
          name="notes"
          rows={2}
          className="resize-none rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/"
          className="rounded-xl px-4 py-2.5 font-body text-sm text-silver/60 transition hover:text-ivory"
        >
          Отказ
        </Link>
        <button
          type="submit"
          className="rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Добави услуга
        </button>
      </div>
    </form>
  );
}
