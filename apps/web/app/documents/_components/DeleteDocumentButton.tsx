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
        className="grid h-9 w-9 place-items-center rounded-lg text-dim transition hover:bg-status-expired/15 hover:text-status-expired"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
        </svg>
      </button>
    </form>
  );
}
