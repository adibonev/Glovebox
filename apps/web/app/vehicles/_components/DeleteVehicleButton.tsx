"use client";

import { deleteVehicle } from "@/app/_lib/actions";

/** Delete a Vehicle with its Service Records and Documents, after a question. */
export function DeleteVehicleButton({
  id,
  name,
  className = "rounded-xl border border-status-expired/40 px-4 py-2.5 font-body text-sm font-semibold text-status-expired transition hover:bg-status-expired/10",
}: {
  id: string;
  name: string;
  className?: string;
}) {
  return (
    <form
      action={deleteVehicle}
      onSubmit={(e) => {
        if (!confirm(`Да изтрия ли „${name}“? Изтриват се и всичките ѝ срокове и документи.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        Изтрий колата
      </button>
    </form>
  );
}
