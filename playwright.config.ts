import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(baseURL);
const host = parsedBaseUrl.hostname;
const port = parsedBaseUrl.port || "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/artifacts",
  timeout: 45_000,
  workers: 1,
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
      name: "chromium",
      testMatch: /.*\.pw\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      }
    }
  ],
  webServer: {
    command: `pnpm dev -- --hostname ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
