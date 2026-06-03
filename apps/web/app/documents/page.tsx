import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { getDocumentsData, type DocView, type ServiceGroup } from "../_lib/documents";
import { DeleteDocumentButton } from "./_components/DeleteDocumentButton";
import { UploadButton } from "./_components/UploadButton";

export const metadata = { title: "Glovebox — Документи" };

export default async function DocumentsPage() {
  const data = await getDocumentsData();
  if (!data) redirect("/login");

  const { vehicles, totalDocuments, hasServices } = data;

  return (
    <Shell email={data.userEmail}>
      <div className="anim-up anim-d1 mb-6 mt-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Документи</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Дигиталната жабка
        </h1>
        <p className="mt-2 font-body text-muted">
          {totalDocuments > 0
            ? `${totalDocuments} ${totalDocuments === 1 ? "документ" : "документа"} — закачени към услугите на колите ти.`
            : "Качи полици, винетки и документи към съответната услуга — винаги под ръка."}
        </p>
      </div>

      {!hasServices ? (
        <EmptyState />
      ) : (
        <div className="anim-up anim-d2 flex flex-col gap-8">
          {vehicles.map((group) => (
            <section key={group.vehicleId}>
              <h2 className="mb-3 font-display text-[20px] font-semibold tracking-tight text-ivory">
                {group.name}
              </h2>
              <div className="flex flex-col gap-3">
                {group.services.map((service) => (
                  <ServiceDocuments key={service.serviceId} service={service} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}

function ServiceDocuments({ service }: { service: ServiceGroup }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-panel to-ink2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-copper">
            <ServiceTypeIcon type={service.serviceType} className="h-5 w-5" />
          </span>
          <div>
            <p className="font-body font-medium text-ivory">{service.typeLabel}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
              изтича {service.expiryLabel}
            </p>
          </div>
        </div>
        <UploadButton serviceId={service.serviceId} />
      </div>

      {service.documents.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {service.documents.map((doc) => (
            <DocumentChip key={doc.id} doc={doc} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-body text-sm text-dim">Няма прикачени документи</p>
      )}
    </div>
  );
}

function DocumentChip({ doc }: { doc: DocView }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-2.5 pr-1.5">
      <span aria-hidden className="text-sm">
        {doc.isImage ? "🖼️" : "📄"}
      </span>
      {doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[220px] truncate font-body text-[13px] text-muted transition hover:text-copper"
        >
          {doc.name}
        </a>
      ) : (
        <span className="max-w-[220px] truncate font-body text-[13px] text-muted">{doc.name}</span>
      )}
      <DeleteDocumentButton id={doc.id} name={doc.name} />
    </li>
  );
}

function EmptyState() {
  return (
    <div className="anim-up anim-d2 rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
      <p className="font-body text-muted">
        Първо добави услуга, към която да качиш документи.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/add-service"
          className="rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70"
        >
          Добави услуга
        </Link>
      </div>
    </div>
  );
}
