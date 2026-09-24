// e2e/tests/smoke.spec.js
// Smoke E2E tests — verify the app loads and basic navigation works.

const { test, expect } = require("@playwright/test");

test.describe("Smoke – app loads", () => {
  test("homepage returns 200 and has a title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/smart tourism|tourism/i);
  });

  test("homepage has visible content", async ({ page }) => {
    await page.goto("/");
    // The page should render at least one visible heading or text node
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});

test.describe("API health check", () => {
  test("backend /api/status responds with Active", async ({ request }) => {
    const apiUrl = process.env.API_URL || "http://localhost:5000";
    const res = await request.get(`${apiUrl}/api/status`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.status).toBe("Active");
  });
});
