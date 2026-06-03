"use client";

import { deleteVehicle } from "@/app/_lib/actions";

/** Delete a Vehicle (and its Service Records) after a confirmation prompt. */
export function DeleteVehicleButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteVehicle}
      onSubmit={(e) => {
        if (!confirm(`Да изтрия ли „${name}“? Това ще премахне и всичките ѝ услуги.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-white/10 px-3 py-2 font-body text-sm font-medium text-muted transition hover:border-status-expired/50 hover:text-status-expired"
      >
        Изтрий
      </button>
    </form>
  );
}
