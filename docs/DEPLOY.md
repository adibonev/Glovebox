# Deploy — Glovebox web (Vercel)

The production build is green and there's a Vercel Cron for the daily reminders
(`apps/web/vercel.json`). Steps to go live:

## 1. Push the repo to GitHub
```
git remote add origin https://github.com/<you>/glovebox.git
git push -u origin main
```

## 2. Create the Vercel project
- Vercel → **Add New… → Project** → import the GitHub repo.
- **Root Directory:** `apps/web`  (it's a pnpm/Turborepo monorepo).
- Framework preset: **Next.js** (auto-detected). Leave build/install commands default —
  Vercel installs the whole pnpm workspace and transpiles `@glovebox/*` from source.

## 3. Environment Variables (Production)
Add these in Vercel → Project → Settings → Environment Variables. Values come from
`apps/web/.env.local` (and `packages/core/.env` for the service-role key). **Never** mark
the non-`NEXT_PUBLIC_` ones as exposed to the browser.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only (webhook, cron, billing-success) |
| `RESEND_API_KEY` | email delivery |
| `REMINDER_FROM` | `Glovebox <noreply@yourdomain>` once the domain is verified |
| `CRON_SECRET` | a strong random string; Vercel Cron sends it as `Authorization: Bearer …` |
| `STRIPE_SECRET_KEY` | `sk_test_…` for staging, `sk_live_…` for real payments |
| `STRIPE_WEBHOOK_SECRET` | from the production webhook endpoint (step 4) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_…` (live IDs in live mode) |
| `STRIPE_PRICE_PRO_ANNUAL` | `price_…` |

Leave `REMINDER_TEST_TO` **unset** in production.

## 4. Post-deploy wiring (use the deployed URL, e.g. `https://glovebox.vercel.app`)
- **Supabase → Authentication → URL Configuration:** Site URL = the deployed URL; add
  Redirect URLs: `https://<domain>/auth/callback` and `https://<domain>/**`.
- **Stripe → Developers → Webhooks → Add endpoint:** URL `https://<domain>/api/stripe/webhook`,
  events: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`. Copy the **Signing secret**
  → set `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy.
- **Resend:** verify your domain, set `REMINDER_FROM` to a sender on it.
- **Google sign-in** works through Supabase's provider with no extra setup, but then Google's
  account chooser says "continue to xclqfebkmebageqnamvp.supabase.co". To have it say
  glovebox.bg, the login page can use Google's own button instead (`components/GoogleSignIn.tsx`):
  1. Google Cloud Console → APIs & Services → Credentials → the OAuth client Supabase uses
     (`527569771820-tnq0….apps.googleusercontent.com`) → **Authorized JavaScript origins**: add
     `https://www.glovebox.bg`, `https://glovebox.bg` and, for local work, `http://localhost:3000`
     and `http://localhost`.
  2. Vercel: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = that client id (Config, not Sensitive) → redeploy.
  Without the variable the page keeps the redirect flow; set it only after step 1, or Google
  refuses the button with `origin_mismatch`. Supabase needs nothing new: the id is already its
  client, and Supabase accepts ID tokens issued to it.

## 5. Reminders cron
`apps/web/vercel.json` runs `GET /api/cron/send-reminders` daily at 08:00 UTC. With
`CRON_SECRET` set, Vercel authenticates the call automatically. (Hobby plan = daily cron.)

## 6. Going to real payments
Switch Stripe to **Live mode**: live keys, recreate the two Prices (live `price_…`), a live
webhook endpoint + its signing secret. Update the env vars accordingly.
