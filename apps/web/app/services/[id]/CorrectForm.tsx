"use client";

import { isExpiringServiceType } from "@glovebox/core";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { updateService } from "../../_lib/actions";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from "../../_lib/labels";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

/**
 * Fixing what was entered wrong: the date, the price, or (rarely) the kind. Not a renewal, which
 * has its own form above; a new period belongs there, so that the old one is kept.
 */
export function CorrectForm({
  serviceId,
  serviceType,
  expiryDate,
  cost,
}: {
  serviceId: string;
  serviceType: string;
  expiryDate: string;
  cost: string;
}) {
  const [type, setType] = useState(serviceType);
  const expiring = isExpiringServiceType(type);

  return (
    <form action={updateService} className="flex flex-col gap-5">
      <input type="hidden" name="serviceId" value={serviceId} />

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{expiring ? "Срок до" : "Дата на разхода"}</span>
        <input type="date" name="expiryDate" defaultValue={expiryDate} required className={fieldClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>
          Цена (€) <span className="text-dim">· по избор</span>
        </span>
        <input type="text" name="cost" inputMode="decimal" defaultValue={cost} placeholder="напр. 120" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Вид</span>
        <select name="serviceType" value={type} onChange={(event) => setType(event.target.value)} className={fieldClass}>
          {SERVICE_TYPE_ORDER.map((code) => (
            <option key={code} value={code}>
              {SERVICE_TYPE_LABELS[code]}
            </option>
          ))}
        </select>
      </label>

      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-xl border border-white/15 px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-white/30 disabled:opacity-60"
    >
      {pending ? "Записване…" : "Запази промените"}
    </button>
  );
}
