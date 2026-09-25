# Мониторинг — Glovebox

Уеб приложението има вградени **Sentry** (грешки + производителност) и **PostHog**
(продуктова аналитика). И двете са **opt-in**: без съответните env променливи кодът е
напълно неактивен — нищо не се изпраща, билдът е непокътнат. Включваш ги, като добавиш
ключовете (локално в `apps/web/.env.local` и в **Vercel → Project → Settings → Environment
Variables**), после redeploy.

---

## Sentry (грешки)

### 1. Създай проект
1. Регистрирай се в <https://sentry.io> (изберни регион **EU**, ако държиш данните в ЕС).
2. **Create Project → Platform: Next.js**. Името напр. `glovebox-web`.
3. Копирай **DSN** (Settings → Projects → glovebox-web → Client Keys (DSN)).

### 2. Env променливи
| Име | Къде | Стойност |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | local + Vercel | DSN-ът от стъпка 1 (включва мониторинга) |
| `SENTRY_ORG` | Vercel (по избор local) | slug на организацията (за качване на source maps) |
| `SENTRY_PROJECT` | Vercel | `glovebox-web` |
| `SENTRY_AUTH_TOKEN` | **само Vercel** | Auth token за source maps (Settings → Auth Tokens) |

> `SENTRY_AUTH_TOKEN` е **таен** — само в build средата (Vercel/CI), никога с `NEXT_PUBLIC_`.
> Без него билдът пак минава, просто без четими (un-minified) stack traces.

### 3. Какво е включено
- Грешки от клиента, server components, route handlers и middleware (edge).
- **Session Replay само при грешка** — текстът е маскиран, медията блокирана (GDPR-friendly).
- Трафикът минава през `/monitoring` (tunnel), за да не го реже ad-blocker.

Файлове: `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
`instrumentation-client.ts`, плюс обвивката в `next.config.mjs`.

---

## PostHog (аналитика)

### 1. Създай проект
1. Регистрирай се в <https://posthog.com> (регион **EU** → host `https://eu.i.posthog.com`).
2. Project Settings → копирай **Project API Key** (започва с `phc_...`).

### 2. Env променливи
| Име | Къде | Стойност |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | local + Vercel | `phc_...` (включва аналитиката) |
| `NEXT_PUBLIC_POSTHOG_HOST` | local + Vercel | `https://eu.i.posthog.com` (EU) или `https://us.i.posthog.com` (US) |

### 3. Какво е включено
- **Pageviews + pageleaves** автоматично при навигация (SPA).
- **Autocapture** на кликове по бутони/линкове.
- **Identify** на влезли потребители (по `auth user id` + имейл) — само за тях се правят
  person profiles (`identified_only`).

Файлове: `components/PostHogProvider.tsx` (в `app/layout.tsx`),
`components/PostHogIdentify.tsx` (в `components/Shell.tsx`).

---

## Meta Pixel (реклами, уеб)

| Име | Къде | Стойност |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | local + Vercel | ID на Pixel-а от Meta Events Manager |

Зарежда се **само след съгласие** в банера (същото съгласие като PostHog). Праща `PageView` на
всяка страница и `CompleteRegistration` веднъж за нов акаунт (`components/SignupTracker.tsx`).
Кампанията, от която идва регистрацията (utm етикетите), се пази отделно в
`users.signup_campaign`, без съгласие, защото не съдържа нищо идентифициращо.

---

## Мобилно приложение (Sentry + PostHog)

Env променливи в **EAS** (`eas env:create --environment production`), не в `.env.local`:

| Име | Стойност |
| --- | --- |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN на **отделен** Sentry проект (Platform: React Native), напр. `glovebox-mobile` |
| `EXPO_PUBLIC_POSTHOG_KEY` | същият `phc_...` като на уеба (един човек = един профил) |
| `EXPO_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |

- **Sentry** (`lib/monitoring.ts`) тръгва без съгласие, като на уеба: легитимен интерес, без
  имейл и IP, само id на акаунта. За четими stack traces добави плъгина
  `["@sentry/react-native/expo", { "organization": "...", "project": "glovebox-mobile" }]` в
  `app.json` и `SENTRY_AUTH_TOKEN` като EAS secret. **Без токена не добавяй плъгина**: стъпката
  му за качване на символи чупи iOS билда.
- **PostHog** (`lib/analytics.ts`) не праща нищо, докато човекът не натисне „Разреши“ (карта на
  Таблото; превключвател „Анонимна статистика“ в Профил). Идентифицира се само с id на акаунта.
- След включване обнови **App Privacy** в App Store Connect: Crash Data и Product Interaction,
  свързани с потребителя, без проследяване.

---

## Бърза проверка след включване
1. Добави ключовете в `apps/web/.env.local`, рестартирай `pnpm --filter web dev`.
2. **Sentry:** хвърли тестова грешка (напр. бутон с `throw new Error("sentry test")`) → виж я
   в Sentry → Issues. (Махни тестовия бутон след това.)
3. **PostHog:** разходи се из сайта → виж събитията в PostHog → Activity (live events).
4. За продукция: добави същите променливи във Vercel и **Redeploy**.

## За после (по желание)
- Server-side събития за конверсии (`posthog-node`): регистрация, started checkout, subscribed.
- По-нисък `tracesSampleRate` в Sentry, когато трафикът порасне.
- Алармиране на грешки (Sentry → Alerts) към имейл/Slack.
