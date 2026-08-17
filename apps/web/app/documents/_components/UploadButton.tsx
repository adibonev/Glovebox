"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { uploadDocument } from "@/app/_lib/actions";
import { NO_FORM_ERROR } from "@/app/_lib/formState";
import { documentTooLargeMessage } from "@/app/_lib/upload";

/** A compact "add document" control that uploads the moment a file is chosen. */
export function UploadButton({ serviceId }: { serviceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [state, submit] = useActionState(uploadDocument, NO_FORM_ERROR);
  const error = fileError ?? state.error;

  return (
    <form ref={formRef} action={submit} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Picker
        onPicked={(file) => {
          // Over the Server Action body limit the request dies before reaching us, so the
          // upload has to be refused here rather than appearing to do nothing.
          const tooLarge = documentTooLargeMessage(file);
          setFileError(tooLarge);
          if (!tooLarge) formRef.current?.requestSubmit();
        }}
      />
      {error && (
        <p role="alert" className="max-w-[240px] text-right font-body text-[12px] text-[#E0705C]">
          {error}
        </p>
      )}
    </form>
  );
}

function Picker({ onPicked }: { onPicked: (file: File) => void }) {
  const { pending } = useFormStatus();
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-copper/40 bg-copper/[0.08] px-3 py-1.5 font-body text-[13px] font-semibold text-copper transition hover:border-copper/70 hover:bg-copper/[0.14] ${
        pending ? "pointer-events-none opacity-70" : ""
      }`}
    >
      {pending ? "Качване…" : "+ Документ"}
      <input
        type="file"
        name="file"
        accept="application/pdf,image/*"
        disabled={pending}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPicked(file);
        }}
      />
    </label>
  );
}
