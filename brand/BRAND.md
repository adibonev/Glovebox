# Brand — Glovebox

The car's glove compartment, where documents live → a digital glovebox for your vehicle's
documents and deadlines. Feel: **cinematic premium** (luxury-automotive), trustworthy, calm.

## Logo
- **Wordmark:** "Glovebox" — "Glove" in ink/white, "box" in copper, and the **"o" in box is a
  steering wheel**. Set in **Fraunces**. For production, convert the wordmark to outlines.
- **App icon / symbol:** the steering wheel — `brand/glovebox-wheel.svg`. On the store tile:
  `brand/glovebox-appicon.svg` (wheel on a dark emerald-black tile with a soft copper glow).
- Monochrome: single-colour wheel + wordmark for print / small sizes.

## Color
| Token | Hex | Use |
| --- | --- | --- |
| Ink | `#07100C` | backgrounds, base |
| Emerald (anchor) | `#14503A` | primary actions, brand anchor |
| Copper (accent) | `#C4954C` | accents, the gauge, key numbers, logo "box" |
| Silver | `#CFD2CB` | strokes, secondary lines, instruments |
| Ivory | `#F4F1EA` | light surfaces / text on dark |

Status (functional, separate from brand): valid `#5FCF9A` · expiring `#E3A93A` · expired `#E0705C`.

## Type (ADR-0009)
- **Sofia Sans Condensed** 700–800 — headings. Bulgarian letterforms by default.
- **Sofia Sans** — UI/body text on the web.
- **JetBrains Mono** — plates, dates, small labels, spec-style metadata.
- **Fraunces** — the logo wordmark and bare figures only (it has no Cyrillic).
- Mobile keeps the iOS system font for text, which already sets Bulgarian correctly.

Use shadcn primitives only when re-themed to these tokens.

## Surfaces
Dark ink for the app and the dashboard. **Paper** (`paper` tokens, ivory base) wherever the
page shows documents. One radius for cards, nearly square corners for documents.

## Motion
One idea, not ten effects: the gauge fills. No breathing glows, floating cards, light sweeps
or word-by-word headlines. Framer Motion (web) / Reanimated (mobile).
EOF
