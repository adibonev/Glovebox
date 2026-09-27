import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests for the app's plain helpers (lib/*.test.ts). Screens are not run here: they need
// React Native, and the rules they show come from core, which has its own tests.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts"] },
});
