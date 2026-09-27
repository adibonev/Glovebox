"use client";

import { deleteService } from "../../_lib/actions";

/** Delete the Service Record with its Documents, after a question. */
export function DeleteServiceButton({ serviceId, label }: { serviceId: string; label: string }) {
  return (
    <form
      action={deleteService}
      onSubmit={(event) => {
        if (!confirm(`Да изтрия ли „${label}“? Изтриват се и документите към този срок.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="serviceId" value={serviceId} />
      <button
        type="submit"
        className="rounded-xl border border-status-expired/40 px-4 py-2.5 font-body text-sm font-semibold text-status-expired transition hover:bg-status-expired/10"
      >
        Изтрий срока
      </button>
    </form>
  );
}
