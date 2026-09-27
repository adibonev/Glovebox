import Link from "next/link";

import type { DocView } from "../_lib/documents";
import { DeleteDocumentButton } from "../documents/_components/DeleteDocumentButton";

/**
 * Documents, each opening in a new tab and deletable after a question. On a record's own page
 * they are that record's; on the Documents page each also names, and links to, its record.
 */
export function DocumentList({ documents }: { documents: DocView[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-3 pr-2"
        >
          <FileIcon image={doc.isImage} />
          <div className="flex min-w-0 flex-1 flex-col">
            {doc.url ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-body text-sm text-silver transition hover:text-copper"
              >
                {doc.name}
              </a>
            ) : (
              <span className="truncate font-body text-sm text-muted">{doc.name}</span>
            )}
            {doc.record && (
              <Link
                href={`/services/${doc.record.id}`}
                className="truncate font-body text-[12px] text-dim transition hover:text-ivory"
              >
                {doc.record.label}
              </Link>
            )}
          </div>
          <DeleteDocumentButton id={doc.id} name={doc.name} />
        </li>
      ))}
    </ul>
  );
}

/** A photo or a page, drawn: the emoji used before came out differently on every system. */
function FileIcon({ image }: { image: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-copper" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {image ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M21 16l-5-5-8 8" />
        </>
      ) : (
        <>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </>
      )}
    </svg>
  );
}
