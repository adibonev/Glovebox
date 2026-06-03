"use client";

import { deleteDocument } from "@/app/_lib/actions";

/** Remove a Document (storage file + row) after a confirmation prompt. */
export function DeleteDocumentButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteDocument}
      onSubmit={(e) => {
        if (!confirm(`Да изтрия ли „${name}“?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Изтрий документа"
        title="Изтрий"
        className="grid h-6 w-6 place-items-center rounded-md text-dim transition hover:bg-status-expired/15 hover:text-status-expired"
      >
        ✕
      </button>
    </form>
  );
}
