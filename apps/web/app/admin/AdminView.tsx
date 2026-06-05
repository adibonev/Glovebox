import { grantPro, revokePro } from "./actions";

export function AdminView({
  ok,
  error,
  email,
}: {
  ok?: string;
  error?: string;
  email?: string;
}) {
  return (
    <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Админ</p>
      <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
        Pro пасове
      </h1>
      <p className="mt-2 font-body text-muted">
        Дай или отнеми Pro на потребител по имейл. Влиза в сила веднага.
      </p>

      {ok && (
        <div className="mt-5 rounded-xl border border-status-valid/40 bg-status-valid/[0.08] px-4 py-3 font-body text-sm text-ivory">
          <span className="font-semibold text-status-valid">{email}</span> вече е{" "}
          <span className="font-semibold">{ok === "pro" ? "Pro" : "Free"}</span>. ✅
        </div>
      )}
      {error === "notfound" && (
        <div className="mt-5 rounded-xl border border-status-expired/40 bg-status-expired/[0.08] px-4 py-3 font-body text-sm text-status-expired">
          Няма потребител с имейл <span className="font-semibold">{email}</span>.
        </div>
      )}
      {error === "empty" && (
        <div className="mt-5 rounded-xl border border-status-expired/40 bg-status-expired/[0.08] px-4 py-3 font-body text-sm text-status-expired">
          Въведи имейл.
        </div>
      )}

      <form className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
            Имейл на потребителя
          </span>
          <input
            type="email"
            name="email"
            required
            defaultValue={email ?? ""}
            placeholder="klient@email.com"
            autoComplete="off"
            className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            formAction={grantPro}
            className="rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Дай Pro
          </button>
          <button
            type="submit"
            formAction={revokePro}
            className="rounded-xl border border-white/15 px-5 py-2.5 font-body text-sm font-semibold text-silver transition hover:border-white/30 hover:text-ivory"
          >
            Върни Free
          </button>
        </div>
      </form>
    </section>
  );
}
