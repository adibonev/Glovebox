import {
  SupabaseDocumentRepository,
  calendarDay,
  daysUntil,
  expiryStatus,
  isExpiringServiceType,
  suggestedExpiry,
} from "@glovebox/core";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { writableCarOwner } from "@/app/_lib/access";
import type { DocView } from "@/app/_lib/documents";
import { SERVICE_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, formatCost, formatRecordSummary } from "@/app/_lib/labels";
import { getReminderConfig } from "@/app/_lib/reminderSettings";
import { currentAuthUser, currentUser } from "@/app/_lib/session";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { DocumentList } from "../../_components/DocumentList";
import { saveServiceNote } from "../../_lib/actions";
import { UploadButton } from "../../documents/_components/UploadButton";
import { CorrectForm } from "./CorrectForm";
import { DeleteServiceButton } from "./DeleteServiceButton";
import { RenewForm } from "./RenewForm";

export const metadata = { title: "Срок · Glovebox" };

const NOTICES: Record<string, string> = {
  renewed: "Срокът е подновен. Старият период се пази в паспорта на колата.",
  saved: "Промените са запазени.",
  note: "Бележката е запазена.",
};

/**
 * One Service Record, everything about it in one place: when it runs out, renewing it, its
 * Documents, a note, fixing a mistake, deleting it. The dashboard's rows lead here.
 */
export default async function ServiceRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ renewed?: string; saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { renewed, saved, error } = await searchParams;
  const supabase = await createClient();
  const authUser = await currentAuthUser();
  if (!authUser) redirect("/login");
  const profile = await currentUser();
  if (!profile) redirect("/login");

  // Scoped explicitly to the User's car or one shared with them: an Administrator's RLS policy
  // reads every Service Record, so RLS alone is not enough.
  const { data: service } = await supabase
    .from("services")
    .select("id, car_id, service_type, expiry_date, notes, cost")
    .eq("id", Number(id))
    .maybeSingle();
  if (!service || !service.expiry_date) redirect("/");
  if (!(await writableCarOwner(supabase, Number(profile.id), service.car_id))) redirect("/");

  const [{ data: car }, documents, { windows }] = await Promise.all([
    supabase.from("cars").select("id, brand, model, license_plate").eq("id", service.car_id).maybeSingle(),
    new SupabaseDocumentRepository(supabase).listByServiceRecord(String(service.id)),
    getReminderConfig(supabase, profile.id),
  ]);

  const urls = new Map<string, string>();
  if (documents.length > 0) {
    const { data: signed } = await supabase.storage.from("documents").createSignedUrls(
      documents.map((d) => d.path),
      3600,
    );
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  const docs: DocView[] = documents.map((d) => ({
    id: d.id,
    name: d.name,
    url: urls.get(d.path) ?? null,
    isImage: (d.mimeType ?? "").startsWith("image/"),
  }));

  const label = SERVICE_TYPE_LABELS[service.service_type] ?? service.service_type;
  const expiring = isExpiringServiceType(service.service_type);
  const expiry = new Date(service.expiry_date);
  const today = calendarDay(new Date());
  const days = daysUntil(expiry, today);
  const status = expiring
    ? expiryStatus(
        { id: String(service.id), vehicleId: String(service.car_id), serviceType: service.service_type, expiryDate: expiry, cost: service.cost },
        windows[service.service_type] ?? 30,
        today,
      )
    : null;
  const cost = formatCost(service.cost);
  const summary = formatRecordSummary({ expiring, expiryDate: expiry, days });
  const carName = car ? `${car.brand} ${car.model}` : "";
  const notice = renewed ? NOTICES.renewed : saved === "note" ? NOTICES.note : saved ? NOTICES.saved : null;

  return (
    <Shell email={authUser.email ?? ""}>
      <section className="mx-auto mt-2 flex max-w-2xl flex-col gap-5">
        <Link href={`/?v=${service.car_id}`} className="font-body text-sm text-muted transition hover:text-ivory">
          ← Табло
        </Link>

        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
            {carName}
            {car?.license_plate ? ` · ${car.license_plate}` : ""}
          </p>
          <h1 className="mt-2 font-display text-[clamp(30px,4vw,42px)] font-bold tracking-tight text-ivory">{label}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {status && status !== "Valid" && (
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: STATUS_COLORS[status], backgroundColor: `${STATUS_COLORS[status]}1f` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                {STATUS_LABELS[status]}
              </span>
            )}
            <p className="font-body text-silver">
              {summary}
              {cost && <span className="text-copper"> · {cost}</span>}
            </p>
          </div>
        </header>

        {notice && (
          <p role="status" className="rounded-card border border-status-valid/40 bg-status-valid/10 px-4 py-3 font-body text-sm text-ivory">
            {notice}
          </p>
        )}
        {error === "delete" && (
          <p role="alert" className="rounded-card border border-status-expired/40 bg-status-expired/10 px-4 py-3 font-body text-sm text-ivory">
            Срокът не беше изтрит, защото документите му не се махнаха. Опитай пак след малко.
          </p>
        )}

        {expiring && (
          <Card title="Поднови" lead="Платил си за нов период? Въведи новия срок. Старият се пази в паспорта на колата.">
            <RenewForm
              serviceId={String(service.id)}
              isVignette={service.service_type === "vignette"}
              suggested={suggestedExpiry(expiry, today).toISOString().slice(0, 10)}
            />
          </Card>
        )}

        <Card title="Документи" action={<UploadButton serviceId={String(service.id)} />}>
          {docs.length > 0 ? (
            <DocumentList documents={docs} />
          ) : (
            <p className="font-body text-sm text-dim">Качи полицата или бележката за плащане, за да са ти под ръка.</p>
          )}
        </Card>

        <Card title="Бележка">
          <form action={saveServiceNote} className="flex flex-col gap-3">
            <input type="hidden" name="serviceId" value={String(service.id)} />
            <textarea
              name="notes"
              rows={3}
              defaultValue={service.notes ?? ""}
              placeholder="Застраховател, номер на полицата, сервиз…"
              aria-label="Бележка"
              className="resize-y rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
            />
            <button
              type="submit"
              className="self-start rounded-xl border border-white/15 px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:border-white/30"
            >
              Запази бележката
            </button>
          </form>
        </Card>

        <details className="group rounded-card border border-white/10 bg-panel">
          <summary className="cursor-pointer list-none px-5 py-4 font-body font-semibold text-ivory marker:hidden">
            Поправи данните
            <span className="ml-2 font-body text-sm font-normal text-muted">грешна дата, цена или вид</span>
          </summary>
          <div className="border-t border-white/[0.06] px-5 py-5">
            <CorrectForm
              serviceId={String(service.id)}
              serviceType={service.service_type}
              expiryDate={service.expiry_date.slice(0, 10)}
              cost={service.cost != null ? String(service.cost).replace(".", ",") : ""}
            />
          </div>
        </details>

        <div className="flex justify-end pt-2">
          <DeleteServiceButton serviceId={String(service.id)} label={label} />
        </div>
      </section>
    </Shell>
  );
}

function Card({ title, lead, action, children }: { title: string; lead?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card border border-white/10 bg-panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[20px] font-bold tracking-tight text-ivory">{title}</h2>
          {lead && <p className="mt-1 font-body text-sm text-muted">{lead}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
