import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests for the website's server helpers (app/_lib, lib). The pages are covered end to end
// by Playwright (e2e/, `pnpm --filter web e2e`).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["app/**/*.test.ts", "lib/**/*.test.ts"] },
});
