"use client";

import { useActionState } from "react";

import { CopyLink } from "@/components/CopyLink";

import { createCarInvite, type InviteState } from "./actions";

/** "Изпрати покана": makes the one-time link and shows it to copy. */
export function InviteForm({ vehicleId }: { vehicleId: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(createCarInvite, {
    link: null,
    error: null,
  });

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {state.link ? (
        <>
          <CopyLink url={state.link} />
          <p className="font-body text-[13px] text-dim">Работи веднъж, седем дни. Прати я само на човека, за когото е.</p>
        </>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
        >
          {pending ? "Момент…" : "Създай връзка за покана"}
        </button>
      )}
      {state.error && <p className="font-body text-sm text-status-expired">{state.error}</p>}
    </form>
  );
}
