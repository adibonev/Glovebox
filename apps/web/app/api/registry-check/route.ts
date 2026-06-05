import { NextResponse } from "next/server";

import { normalizeInspectionResult, normalizePlate } from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

// Registry Check endpoint — looks up a state-registered obligation by plate and returns a Check
// Result. Mirrors /api/extract: the logic (normalising) lives in `core`; only the HTTP fetch is
// here. THIS PR: Roadworthiness Inspection (`inspection`) only, source rta.government.bg.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Only authenticated Users may call this — same protection as /api/extract (anti-abuse).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { plate?: unknown; serviceType?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Only Roadworthiness Inspection in this PR — Vignette / Civil Liability arrive as separate
  // adapters behind the same Registry Checker port (do not add them here).
  if (body.serviceType !== "inspection") {
    return NextResponse.json({ error: "unsupported_service_type" }, { status: 400 });
  }
  if (typeof body.plate !== "string" || body.plate.trim() === "") {
    return NextResponse.json({ error: "missing_plate" }, { status: 400 });
  }

  const plate = normalizePlate(body.plate);
  if (!plate) return NextResponse.json({ error: "missing_plate" }, { status: 400 });

  // -----------------------------------------------------------------------------------------------
  // TODO(adi): map real rta.government.bg request/response here — query with `plate`.
  // The public "Проверка на технически преглед" page (rta.government.bg/.../check-inspection) is
  // almost certainly backed by a JSON endpoint — capture the exact request from the Network tab and
  // POST/GET it with `plate`. Keep concurrency to a single request and respect the site's ToS /
  // robots. Then hand the parsed JSON straight to normalizeInspectionResult (below) unchanged.
  //
  //   const res = await fetch("https://rta.government.bg/api/<...>", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ registrationNumber: plate }),
  //   });
  //   if (!res.ok) return NextResponse.json({ error: "registry_failed" }, { status: 502 });
  //   const raw: unknown = await res.json();
  //
  // Until that's wired, `raw` stays null → normalizeInspectionResult returns status "unknown",
  // so the endpoint is already callable end-to-end.
  const raw: unknown = null;
  // -----------------------------------------------------------------------------------------------

  const result = normalizeInspectionResult(raw, new Date());
  return NextResponse.json(result);
}
