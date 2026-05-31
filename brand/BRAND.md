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

## Type
- **Fraunces** — display, headlines, numerics, the logo wordmark.
- **Hanken Grotesk** — UI/body.
- **JetBrains Mono** — small labels, spec-style metadata.

Avoid generic system fonts. Use shadcn primitives only when re-themed to these tokens.

## Motion
Restrained and "expensive": staggered reveals, slow Ken-Burns on hero imagery, a light sweep,
and a gauge that fills. Framer Motion (web) / Reanimated (mobile).
EOF
