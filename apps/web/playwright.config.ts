import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests of the website in the Chrome already installed on the machine (channel "chrome"),
 * so nothing is downloaded. Against the local dev server by default (started if not running), or
 * any deployment:  E2E_BASE_URL=https://www.glovebox.bg pnpm --filter web e2e
 *
 * They only read: no account is created and nothing is sent.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { baseURL, locale: "bg-BG" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: `${baseURL}/login`, reuseExistingServer: true, timeout: 180_000 },
});
