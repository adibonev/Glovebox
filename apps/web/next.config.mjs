/** @type {import('next').NextConfig} */
const nextConfig = {
  // Consume the workspace packages as TypeScript source (internal packages).
  transpilePackages: ["@glovebox/core", "@glovebox/ui"],
  eslint: {
    // The whole monorepo is linted from the root flat config via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
