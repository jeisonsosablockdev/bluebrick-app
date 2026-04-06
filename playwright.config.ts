import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(baseURL);
const host = parsedBaseUrl.hostname;
const port = parsedBaseUrl.port || "3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "playwright-smoke",
      testMatch: /.*\.pw\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      }
    },
    {
      name: "synpress-phantom",
      testMatch: /.*\.synpress\.spec\.(ts|js|mjs)/,
      use: {
        browserName: "chromium",
        headless: process.env.HEADLESS === "true" || Boolean(process.env.CI),
        viewport: { width: 1280, height: 720 }
      }
    }
  ],
  webServer: {
    command: `npm run dev -- --hostname ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
