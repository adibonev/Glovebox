import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Consume the workspace packages as TypeScript source (internal packages).
  transpilePackages: ["@glovebox/core", "@glovebox/ui"],
  eslint: {
    // The whole monorepo is linted from the root flat config via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Documents are photos/scans of real paperwork, so a submit that carries one is almost
    // always over Next's 1 MB default — which rejected the whole Server Action and left the
    // form looking dead. 4 MB is the most a Vercel Function can accept (4.5 MB platform cap);
    // anything larger is refused client-side with a message (see `_lib/upload.ts`).
    serverActions: { bodySizeLimit: "4mb" },
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
