import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — smoke tests against a deployed URL (Vercel preview /
 * staging / production) OR a local `next start`.
 *
 * Set PLAYWRIGHT_BASE_URL in CI to point at the deployed staging URL. Locally,
 * defaults to http://localhost:3000 and Playwright will start `next start` for
 * you (requires `npm run build` first).
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Only start a local server if no PLAYWRIGHT_BASE_URL is provided. In CI we
  // run against a deployed Vercel preview, not a local build.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
