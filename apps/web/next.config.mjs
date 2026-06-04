import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Consume the workspace packages as TypeScript source (internal packages).
  transpilePackages: ["@glovebox/core", "@glovebox/ui"],
  eslint: {
    // The whole monorepo is linted from the root flat config via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
};

// Engage Sentry's build plugin only when a DSN is configured, so the live build is
// untouched until monitoring is turned on via env. Source maps upload only when
// SENTRY_AUTH_TOKEN is present (set in Vercel/CI); without it the build still succeeds.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Route Sentry traffic through our own domain to dodge ad-blockers.
      tunnelRoute: "/monitoring",
      disableLogger: true,
    })
  : nextConfig;
