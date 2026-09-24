// e2e/playwright.config.js
// Playwright configuration for Smart Tourism E2E tests.

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  // Directory that contains the test files
  testDir: "./tests",

  // Run all tests in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI, zero locally
  retries: process.env.CI ? 1 : 0,

  // Single worker on CI to avoid resource contention with the running servers
  workers: process.env.CI ? 1 : undefined,

  // Reporter: HTML (saved to playwright-report/) + list output to console
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  // Shared settings for every test
  use: {
    // Frontend base URL – overridden via BASE_URL env var in CI
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Capture a screenshot and trace on failure
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },

  // Only run in Chromium on CI (fast); add more locally as needed
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Output folder for test artefacts (screenshots, videos, traces)
  outputDir: "test-results/",
});
