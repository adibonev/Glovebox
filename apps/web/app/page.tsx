import { colors } from "@glovebox/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-copper">
        Phase 0 · scaffold
      </p>
      <h1 className="font-display text-5xl text-ivory">Glovebox</h1>
      <p className="max-w-prose text-silver">
        Монорепо скелетът работи. Споделените дизайн токени се зареждат от{" "}
        <code className="font-mono text-copper">@glovebox/ui</code> — например
        анкър изумруд <code className="font-mono">{colors.emerald}</code>.
      </p>
      <span
        className="inline-block h-3 w-24 rounded-full"
        style={{ backgroundColor: colors.emerald }}
      />
    </main>
  );
}
