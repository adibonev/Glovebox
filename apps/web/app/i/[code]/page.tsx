import { normalizeReferralCode } from "@glovebox/core";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wheel } from "@/components/Wheel";
import { APP_STORE_URL } from "@/lib/appStore";

export const metadata: Metadata = {
  title: "Покана за Glovebox",
  description: "Приятел ти праща Glovebox: сроковете на колата ти, навреме.",
  robots: { index: false, follow: false },
};

/**
 * Where a friend's invite link lands. The code itself is already remembered by the middleware
 * for a sign-up on the web. The App Store cannot carry it into the app, so on an iPhone the page
 * shows it large, to be typed in at sign-up.
 */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeReferralCode(raw);
  if (!code) redirect("/");

  const iPhone = /iPhone|iPad|iPod/.test((await headers()).get("user-agent") ?? "");

  return (
    <main className="relative z-[1] mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-5 py-8">
      <Link href="/" className="flex items-baseline font-brand text-[25px] font-semibold leading-none tracking-tight">
        <span className="text-ivory">Glove</span>
        <span className="flex items-baseline text-copper">
          b
          <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
          x
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-center py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Покана</p>
        <h1 className="mt-3 font-display text-[clamp(40px,9vw,60px)] font-extrabold leading-[0.98] text-ivory">
          Приятел ти праща Glovebox.
        </h1>
        <p className="mt-5 font-body text-[18px] leading-relaxed text-muted">
          Помни кога изтичат гражданската, прегледът, винетката и данъкът, и ти пише навреме.
          Снимаш талона и колата е вътре. Безплатно е.
        </p>

        <div className="mt-8 rounded-card border border-white/10 bg-panel p-5">
          <p className="font-body text-sm text-silver">
            {iPhone
              ? "Като инсталираш приложението, въведи този код при регистрация:"
              : "Ако се регистрираш от приложението за iPhone, въведи този код:"}
          </p>
          <p className="mt-3 font-mono text-[34px] font-bold tracking-[0.3em] text-copper">{code}</p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {iPhone ? (
            <>
              <AppStoreBadge />
              <Link href="/login?mode=signup" className="px-2 py-3 font-body text-[15px] font-semibold text-silver/85 transition hover:text-ivory">
                или от сайта
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?mode=signup"
                className="rounded-lg bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
              >
                Започни безплатно
              </Link>
              <AppStoreBadge />
            </>
          )}
        </div>
      </div>

      <Link href="/" className="font-body text-sm text-dim transition hover:text-ivory">
        Какво е Glovebox?
      </Link>
    </main>
  );
}

/** Apple's own badge, unaltered, as their marketing guidelines require. */
function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Свали Glovebox от App Store"
      className="inline-block transition hover:opacity-90"
    >
      <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-[50px] w-auto" />
    </a>
  );
}
