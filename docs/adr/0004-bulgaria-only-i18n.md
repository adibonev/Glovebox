# ADR-0004 — Bulgaria-only launch, Bulgarian UI, i18n-ready

**Status:** Accepted

**Context.** The value (винетка, ГО, технически преглед, данък) is BG-specific. Currency is
EUR (Bulgaria adopted the euro in 2026). English brand name is fine/premium in BG.

**Decision.** Launch **Bulgaria-only**, **Bulgarian UI**. Currency **EUR**. Auth: email/password
+ Google + **Apple Sign-In** (required by Apple when offering social login on iOS). Keep all
user-facing strings centralized (i18n-ready) so English can be added later without a rewrite.
Service Types are a **catalog in `core`**, not hardcoded across the UI, so a future country
pack is additive.

**Consequences.** Focused launch. No full i18n runtime yet, but no hardcoded strings either.
