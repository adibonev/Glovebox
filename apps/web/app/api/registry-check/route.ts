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
  // NOTE: the official ГТП source (POST rta.government.bg/services/check-inspection/checkinsp.php)
  // is gated by a per-session CAPTCHA, so it can't (and shouldn't, per ToS) be auto-fetched from a
  // server — the add-service UI links out to the official check instead. This route stays as the
  // RegistryChecker seam for a future CAPTCHA-FREE source (an official API, or an insurance /
  // vignette partner adapter behind the same port). Until such a source exists, `raw` is null →
  // normalizeInspectionResult returns status "unknown".
  const raw: unknown = null;
  // -----------------------------------------------------------------------------------------------

  const result = normalizeInspectionResult(raw, new Date());
  return NextResponse.json(result);
}
