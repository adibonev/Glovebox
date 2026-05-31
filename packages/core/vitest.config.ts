import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    include: ["src/**/*.test.ts"],
    // Surface env (e.g. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) into the test process so
    // the optional Supabase integration test can read it. .env files here are git-ignored.
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
