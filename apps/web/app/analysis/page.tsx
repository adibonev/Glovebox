import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";

import { getAnalysisData } from "../_lib/analysis";
import { AnalysisView } from "./AnalysisView";

export const metadata = { title: "Glovebox — Анализ" };

export default async function AnalysisPage() {
  const data = await getAnalysisData();
  if (!data) redirect("/login");

  return (
    <Shell email={data.userEmail}>
      <div className="anim-up anim-d1 mb-6 mt-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Анализ</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Къде отиват парите
        </h1>
        <p className="mt-2 font-body text-muted">
          Филтрирай по кола или вид услуга; виж разпределението и разхода във времето.
        </p>
      </div>

      <AnalysisView vehicles={data.vehicles} records={data.records} />
    </Shell>
  );
}
