import { NextResponse } from "next/server";

import { SERVICE_EXTRACTION_PROMPT, parseExtractedServiceInfo } from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

// Reads a vehicle document with a vision model and returns the fields we can prefill on a
// Service Record. Provider-agnostic at this seam — only the fetch below is OpenAI-specific, so
// swapping models later is a one-spot change. The OPENAI_API_KEY stays server-only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — a phone photo is well under this

export async function POST(req: Request) {
  // Only authenticated Users may call this — protects the OpenAI credit from anonymous abuse.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "image_only" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SERVICE_EXTRACTION_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Извлечи данните от този документ." },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ],
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "ai_unreachable" }, { status: 502 });
  }

  if (!res.ok) return NextResponse.json({ error: "ai_failed" }, { status: 502 });

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  return NextResponse.json(parseExtractedServiceInfo(parsed));
}
