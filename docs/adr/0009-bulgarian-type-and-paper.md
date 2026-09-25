# ADR-0009 — Bulgarian type, one animation, and paper

**Status:** Accepted. Supersedes the typography and motion parts of ADR-0005.

**Context.** ADR-0005 set Fraunces (display) and Hanken Grotesk (UI). Neither has Cyrillic, so
every Bulgarian heading fell through the stack. Worse, next/font's metric-matched fallback for
Fraunces is Times New Roman, which *does* have Cyrillic, so headings rendered in Times before
the Cyrillic font further down was ever asked. The landing page also carried most of the effects
that make a page read as generated: breathing radial glows, a floating card, a light sweep every
few seconds, a headline revealed word by word, a grid of four identical icon cards, and copy
built on dashes and stock phrases.

**Decision.**
- **Type (web):** Sofia Sans Condensed 700–800 for headings, Sofia Sans for text, JetBrains Mono
  for plates, dates and labels. Sofia Sans is by Lettersoup, a Bulgarian studio: its default
  Cyrillic *is* the Bulgarian letterforms (the Russian ones are the `locl` alternates), so no
  feature settings are needed. Fraunces stays for the wordmark and bare figures only, with
  `adjustFontFallback: false`, as `font-brand`.
- **Type (mobile):** unchanged. The iOS system font already sets Bulgarian correctly.
- **Motion:** one animation on the landing page, the gauge filling. Everything else holds still.
- **Paper:** the middle of the landing page is light (`paper` tokens), because documents are
  paper. The dashboard and the app stay dark.
- **Corners:** one radius for cards (`rounded-card`), nearly square for documents (`rounded-doc`).
- **Copy:** short sentences, no dashes, concrete Bulgarian detail over general claims.

**Consequences.** Bulgarian reads as Bulgarian. The palette, the gauge and the dark app from
ADR-0005 stand. Real app screens and a drawn (not photographed) certificate replace the drawn
illustrations; a photographed certificate would put a real owner's name and personal number on a
public page.
