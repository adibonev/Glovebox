"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

import { uploadDocument } from "@/app/_lib/actions";

/** A compact "add document" control that uploads the moment a file is chosen. */
export function UploadButton({ serviceId }: { serviceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={uploadDocument}>
      <input type="hidden" name="serviceId" value={serviceId} />
      <Picker onPicked={() => formRef.current?.requestSubmit()} />
    </form>
  );
}

function Picker({ onPicked }: { onPicked: () => void }) {
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
          if (e.target.files && e.target.files.length > 0) onPicked();
        }}
      />
    </label>
  );
}
