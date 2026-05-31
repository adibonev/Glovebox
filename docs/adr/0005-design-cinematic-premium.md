# ADR-0005 — Design direction: cinematic premium

**Status:** Accepted

**Context.** The old UI felt cheap and static. Reference: luxury car brand sites — dark,
cinematic, image-rich, restrained palette, subtle motion.

**Decision.** Cinematic premium: dark stage, real vehicle imagery, glassmorphism data panels,
an instrument **gauge** for the most urgent expiry, smooth motion (Framer Motion / Reanimated).
Palette: ink `#07100C`, emerald `#14503A` (anchor), copper `#C4954C` (accent), silver
`#CFD2CB`, ivory `#F4F1EA`. Status: valid `#5FCF9A`, expiring `#E3A93A`, expired `#E0705C`.
Fonts: Fraunces (display/numerics), Hanken Grotesk (UI), JetBrains Mono (labels). shadcn is
used as accessible primitives, **re-themed** so it doesn't look like default shadcn.

**Consequences.** Premium, on-theme, memorable. Requires real imagery per vehicle and careful
motion work.
