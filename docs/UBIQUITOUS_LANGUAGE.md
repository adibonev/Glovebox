# Ubiquitous Language — Glovebox

> Canonical domain terminology for the Glovebox rebuild (web + mobile, freemium SaaS).
> Code/schema terms are English; Bulgarian product-facing labels are noted where the
> concept is BG-specific. Billing terms are now finalized (Stripe + RevenueCat).

---

## Vehicles & Records

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Vehicle** | A motor vehicle owned by a User and tracked in the app | Car, auto, automobile |
| **Service Record** | A single tracked obligation or event for a Vehicle with a start and expiry date | Service, entry, record |
| **Service Type** | The category an individual Service Record belongs to (enumerated, BG-specific) | Category, kind |
| **Mileage** | The odometer reading recorded on a Vehicle or Service Record | Kilometers, odo |

### Service Types (the enumeration)

| Canonical | Code value | Bulgarian label |
| --------- | ---------- | --------------- |
| **Civil Liability Insurance** | `civil_liability` | Гражданска отговорност (ГО) |
| **Casco** | `casco` | Каско |
| **Vignette** | `vignette` | Винетка |
| **Roadworthiness Inspection** | `inspection` | Технически преглед |
| **Vehicle Tax** | `tax` | Данък МПС |
| **Fire Extinguisher** | `fire_extinguisher` | Пожарогасител |
| **Maintenance** | `maintenance` | Обслужване |
| **Repair** | `repair` | Ремонт |

> A Service Record is one of two kinds: an **expiring obligation** (all of the above except
> Repair — it has an Expiry Date, an Expiry Status and raises Reminders) or a **dated expense**
> (**Repair** — a one-off cost on a specific date; it never expires, has no Reminder Window or
> Expiry Status, and only feeds the spend Analysis). Each Service Record may record a **Cost**
> (`services.cost`, in EUR).

---

## Reminders & Expiry

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Expiry Date** | The date on which a Service Record stops being valid | Due date, end date |
| **Expiry Status** | The derived state of a Service Record: `Valid`, `Expiring Soon`, or `Expired` | Color status, badge |
| **Reminder** | A notification raised before a Service Record's Expiry Date | Alert, notification |
| **Reminder Window** | The number of days before Expiry Date at which a Reminder fires (7/14/30/60/90), set per Service Type | Reminder days, threshold, lead time |
| **Email Reminder** | A Reminder delivered by email (available on the Free Plan) | Mail alert |
| **Push Notification** | A Reminder delivered to the mobile app (Pro Plan only) | Push, notification |

---

## Registry Checks

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Registry Check** | A lookup against an official government registry that returns the Expiry Status and/or Expiry Date for one Service Type of one Vehicle (first source: Roadworthiness Inspection via rta.government.bg) | Scrape, lookup, sync |
| **Registry Checker** | A port (interface) that performs a Registry Check by registration plate | Provider, client, fetcher |
| **Check Result** | The outcome of a Registry Check: `{ serviceType, expiryDate: ISO\|null, status: "valid"\|"expiring"\|"expired"\|"unknown", checkedAt, source }` | Response, payload |

---

## Documents & Media

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Document** | A user-uploaded file (PDF or image) attached to a Service Record | File, attachment, upload |
| **Avatar** | A User's profile image | Profile photo, picture |

---

## People & Access

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **User** | The authenticated person who owns Vehicles and may hold a Subscription | Customer, member, account |
| **Auth Identity** | The Supabase-managed authentication record (`auth.users`) backing a User | Login, auth account |
| **Linked Provider** | A sign-in method connected to a User (email, Google, **Apple**) | Account (the old `accounts` table) |
| **Administrator** | A User with `is_admin = true` who can view the admin panel | Admin, superuser |

---

## Subscription & Billing

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Plan** | The tier a User is on: **Free**, **Pro**, or **Legacy** | Tier, package |
| **Free Plan** | The no-cost tier with quota-limited features (1 Vehicle, 1 Document, email reminders, PDF export) | Starter, basic |
| **Pro Plan** | The paid tier that unlocks all features (≈2.99 €/mo or 24.99 €/yr) | Premium, paid |
| **Legacy Plan** | A grandfathered tier for pre-billing Users that permanently preserves their existing capabilities | Old plan, free-forever |
| **Subscription** | An active paid commitment that grants the Pro Plan for a Billing Period | Membership, payment |
| **Billing Period** | The cadence of a Subscription: `Monthly` or `Annual` | Billing cycle, term |
| **Trial** | A 14-day grant of the Pro Plan offered to new Users at no cost | Free period, demo |
| **Entitlement** | A concrete capability unlocked by the active Plan (e.g. *push enabled*, *unlimited vehicles*), resolved server-side and read by gating | Permission, feature flag |
| **Quota** | A numeric cap a Free Plan imposes (1 Vehicle, 1 Document) | Limit, cap |
| **Paywall** | The prompt shown when a Free User hits a Quota and is invited to subscribe | Upsell, gate |
| **Billing Channel** | Where a Subscription was purchased: `Web` (Stripe) or `App Store` / `Play Store` (via RevenueCat) — the source of the Entitlement | Payment source, platform |

---

## Relationships

- A **User** owns zero or more **Vehicles**.
- A **Vehicle** has zero or more **Service Records**.
- A **Service Record** has exactly one **Service Type** and one **Expiry Date**, and derives one **Expiry Status**.
- A **Service Record** has zero or more **Documents**.
- A **Reminder** is derived from a **Service Record**'s **Expiry Date** and the **Reminder Window** set for its **Service Type**; it is delivered as an **Email Reminder** and/or a **Push Notification**.
- A **User** is always on exactly one **Plan** (Free by default, Legacy for pre-billing users); the **Pro Plan** is granted by an active **Subscription** or an active **Trial**.
- A **Subscription** has exactly one **Billing Period** and originates from exactly one **Billing Channel**; **Entitlements** are unified across channels server-side (Stripe + RevenueCat webhooks → Supabase).
- An **Entitlement** is granted by the active **Plan** and enforced at each **Quota** and **Paywall**.
- A **User** authenticates through one **Auth Identity** and one or more **Linked Providers**.

---

## Example dialogue

> **Dev:** "A pre-billing **User** with 3 **Vehicles** — what happens when we launch the **Pro Plan**?"

> **Domain expert:** "They go on the **Legacy Plan** — they keep all 3 **Vehicles** and every **Entitlement** they already had, forever. We never strip what they created. **Quotas** only apply to new **Free Plan** Users."

> **Dev:** "And a brand-new User who subscribes in the iPhone app vs on the website?"

> **Domain expert:** "Same **Entitlements**. The **Billing Channel** differs — `App Store` via RevenueCat vs `Web` via Stripe — but we resolve the active **Entitlement** server-side regardless of channel."

> **Dev:** "Does a **Free** User get any **Reminder**?"

> **Domain expert:** "Yes — an **Email Reminder** for their one **Vehicle** at a default **Reminder Window**. **Push Notifications** and custom per-**Service-Type** **Reminder Windows** are **Pro** **Entitlements**."

---

## Resolved decisions (previously flagged ambiguities)

- **"Car" vs "Vehicle"** → Domain term is **Vehicle**. Because there are real users, the physical table stays `cars` (no risky rename); the new code maps to **Vehicle** at the `core` edge. Brand name *Glovebox* is unaffected.
- **"Service" overloaded** → The bare word "service" is reserved for infrastructure/code; the domain entity is always **Service Record**.
- **"User" / "account" collision** → **User** = the person; **Auth Identity** = the `auth.users` record; the old `accounts` table concept is renamed **Linked Provider**.
- **Administrator** → Single source of truth is the **`is_admin` flag**; the standalone `admins` table is retired.
- **Reminder configuration** → Standardize on **Reminder Window** per **Service Type** (`reminder_settings`); the global `reminder_days` is deprecated.
- **Plan naming** → **Free** / **Pro**, plus **Legacy** for grandfathered users. "Starter" is not used.
- **Plan vs Subscription vs Entitlement** → Kept distinct: Plan = tier, Subscription = paid commitment, Entitlement = concrete capability gating reads.
