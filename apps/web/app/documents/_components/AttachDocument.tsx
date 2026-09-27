"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { uploadDocument } from "@/app/_lib/actions";
import type { AttachableRecord } from "@/app/_lib/documents";
import { NO_FORM_ERROR } from "@/app/_lib/formState";
import { documentTooLargeMessage } from "@/app/_lib/upload";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

/**
 * Attach a file from the Documents page: say which Service Record it is for, then pick the file,
 * which uploads at once. The record's own page has the same button without the question.
 */
export function AttachDocument({ groups }: { groups: { name: string; records: AttachableRecord[] }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [state, submit] = useActionState(uploadDocument, NO_FORM_ERROR);
  const error = fileError ?? state.error;
  const offered = groups.filter((group) => group.records.length > 0);
  // One car: its records alone, no heading to choose under.
  const single = offered.length === 1 ? offered[0] : null;

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-body text-sm text-muted">Към кой срок</span>
        <select name="serviceId" required defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Избери срок
          </option>
          {single
            ? single.records.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.label}
                </option>
              ))
            : offered.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.records.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.label}
                    </option>
                  ))}
                </optgroup>
              ))}
        </select>
      </label>
      <Picker
        onPicked={(file, input) => {
          // Over the Server Action body limit the request dies before reaching us, so the
          // upload has to be refused here rather than appearing to do nothing.
          const tooLarge = documentTooLargeMessage(file);
          setFileError(tooLarge);
          if (tooLarge) return;
          // Without a record the browser names the missing choice; the file is picked again after.
          if (!formRef.current?.reportValidity()) {
            input.value = "";
            return;
          }
          formRef.current.requestSubmit();
        }}
      />
      {error && (
        <p role="alert" className="font-body text-[13px] text-status-expired sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

function Picker({ onPicked }: { onPicked: (file: File, input: HTMLInputElement) => void }) {
  const { pending } = useFormStatus();
  return (
    <label
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90 ${
        pending ? "pointer-events-none opacity-70" : ""
      }`}
    >
      {pending ? "Качване…" : "Прикачи документ"}
      <input
        type="file"
        name="file"
        accept="application/pdf,image/*"
        disabled={pending}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPicked(file, e.target);
        }}
      />
    </label>
  );
}
