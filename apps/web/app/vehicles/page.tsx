import { DOCUMENT_SCAN_ENABLED } from "@glovebox/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PlateBadge } from "@/components/PlateBadge";
import { Shell } from "@/components/Shell";

import { getGarage, type GarageVehicle } from "../_lib/vehicles";
import { DeleteVehicleButton } from "./_components/DeleteVehicleButton";

export const metadata = { title: "Glovebox — Автомобили" };

export default async function VehiclesPage() {
  const data = await getGarage();
  if (!data) redirect("/login");

  const { vehicles } = data;

  return (
    <Shell email={data.userEmail}>
      <div className="mb-6 mt-2 flex items-end justify-between gap-4">
        <div className="anim-up anim-d1">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Гараж</p>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
            Моите автомобили
          </h1>
        </div>
        <AddVehicleButton />
      </div>

      {vehicles.length === 0 ? (
        <EmptyGarage />
      ) : (
        <div className="anim-up anim-d2 grid gap-5 sm:grid-cols-2">
          {vehicles.map((v) => (
            <VehicleGridCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function VehicleGridCard({ vehicle }: { vehicle: GarageVehicle }) {
  const { id, name, plate, year, bodyType, urgent, counts, serviceCount } = vehicle;

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2">
      <Link
        href={`/?v=${id}`}
        className="group relative grid h-[150px] place-items-center overflow-hidden bg-[radial-gradient(90%_70%_at_50%_30%,rgba(20,80,58,0.28),transparent_70%)] px-6"
      >
        <img
          src={`/cars/${bodyType}.webp`}
          alt={name}
          draggable={false}
          className="max-h-[110px] w-auto max-w-[88%] select-none transition duration-500 group-hover:scale-[1.04]"
          style={{ filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.5))" }}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ivory">
            {name}
          </h2>
          {year && <span className="font-body text-sm text-dim">{year}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {plate && <PlateBadge plate={plate} size="sm" />}
        </div>

        <StatusLine urgent={urgent} serviceCount={serviceCount} />
        <CountPills counts={counts} />

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Link
            href={`/?v=${id}`}
            className="flex-1 rounded-lg bg-emerald/90 px-3 py-2 text-center font-body text-sm font-semibold text-ivory transition hover:bg-emerald"
          >
            Отвори
          </Link>
          <Link
            href={`/vehicles/${id}/edit`}
            className="rounded-lg border border-white/10 px-3 py-2 font-body text-sm font-medium text-muted transition hover:border-copper/50 hover:text-copper"
          >
            Редакция
          </Link>
          <DeleteVehicleButton id={id} name={name} />
        </div>
      </div>
    </article>
  );
}

function StatusLine({
  urgent,
  serviceCount,
}: {
  urgent: GarageVehicle["urgent"];
  serviceCount: number;
}) {
  if (serviceCount === 0) {
    return <p className="font-body text-sm text-dim">Няма добавени услуги</p>;
  }
  if (!urgent || urgent.status === "Valid") {
    return <p className="font-body text-sm text-status-valid">Всичко е в ред</p>;
  }
  return (
    <p className="font-body text-sm" style={{ color: urgent.color }}>
      {urgent.typeLabel} · {urgent.daysText}
    </p>
  );
}

function CountPills({ counts }: { counts: GarageVehicle["counts"] }) {
  const pills = [
    { n: counts.valid, label: "в сила", token: "bg-status-valid" },
    { n: counts.expiring, label: "изтичат", token: "bg-status-expiring" },
    { n: counts.expired, label: "изтекли", token: "bg-status-expired" },
  ].filter((p) => p.n > 0);

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {pills.map((p) => (
        <span key={p.label} className="inline-flex items-center gap-1.5 font-body text-[13px] text-muted">
          <span className={`h-2 w-2 rounded-full ${p.token}`} />
          {p.n} {p.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The way in. Scanning a document sits behind {@link DOCUMENT_SCAN_ENABLED} and appears
 * alongside manual entry only once it is switched on.
 */
function AddVehicleButton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DOCUMENT_SCAN_ENABLED && (
        <Link
          href="/vehicles/scan"
          className="group inline-flex items-center gap-2 rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70 hover:from-copper/20 hover:shadow-[0_10px_30px_-10px_rgba(196,149,76,0.6)]"
        >
          <span className="grid h-4 w-4 place-items-center rounded-full bg-copper/20 text-copper">
            <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 5.5V3a1 1 0 0 1 1-1h2.5M14 5.5V3a1 1 0 0 0-1-1h-2.5M2 10.5V13a1 1 0 0 0 1 1h2.5M14 10.5V13a1 1 0 0 1-1 1h-2.5M4.5 8h7" />
            </svg>
          </span>
          Сканирай документ
        </Link>
      )}
      <Link
        href="/vehicles/new"
        className="group inline-flex items-center gap-2 rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70 hover:from-copper/20 hover:shadow-[0_10px_30px_-10px_rgba(196,149,76,0.6)]"
      >
        <span className="grid h-4 w-4 place-items-center rounded-full bg-copper/20 text-copper transition group-hover:rotate-90">
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
        </span>
        Добави автомобил
      </Link>
    </div>
  );
}

function EmptyGarage() {
  return (
    <div className="anim-up anim-d2 rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
      <p className="font-body text-muted">Още нямаш добавени автомобили.</p>
      <div className="mt-5 flex justify-center">
        <AddVehicleButton />
      </div>
    </div>
  );
}
