import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";

import { DocumentList } from "../_components/DocumentList";
import { getDocumentsData } from "../_lib/documents";
import { AttachDocument } from "./_components/AttachDocument";

export const metadata = { title: "Документи · Glovebox" };

export default async function DocumentsPage() {
  const data = await getDocumentsData();
  if (!data) redirect("/login");

  const { vehicles, totalDocuments } = data;
  const hasRecords = vehicles.some((v) => v.records.length > 0);
  const withFiles = vehicles.filter((v) => v.documents.length > 0);

  return (
    <Shell email={data.userEmail}>
      <div className="mb-6 mt-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Документи</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-ivory">
          Дигиталната жабка
        </h1>
        <p className="mt-2 font-body text-muted">
          {totalDocuments > 0
            ? `${totalDocuments} ${totalDocuments === 1 ? "документ" : "документа"} към сроковете на колите ти.`
            : "Полицата, талонът, бележката за плащане: качи ги към срока им, за да са ти под ръка."}
        </p>
      </div>

      {!hasRecords ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          <section className="rounded-card border border-white/10 bg-panel p-5">
            <AttachDocument groups={vehicles.map((v) => ({ name: v.name, records: v.records }))} />
          </section>

          {withFiles.length === 0 ? (
            <p className="font-body text-sm text-dim">Още няма качени документи.</p>
          ) : (
            withFiles.map((group) => (
              <section key={group.vehicleId}>
                {/* The car's name only helps when there are several to tell apart. */}
                {vehicles.length > 1 && (
                  <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight text-ivory">{group.name}</h2>
                )}
                <DocumentList documents={group.documents} />
              </section>
            ))
          )}
        </div>
      )}
    </Shell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
      <p className="font-body text-muted">Първо добави срок, към който да качиш документи.</p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/add-service"
          className="rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70"
        >
          Добави срок
        </Link>
      </div>
    </div>
  );
}
