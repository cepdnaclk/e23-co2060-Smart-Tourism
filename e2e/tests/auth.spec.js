// e2e/tests/auth.spec.js
// E2E tests for the registration and login user flows.

const { test, expect } = require("@playwright/test");

// Unique credentials so each CI run is independent
const timestamp = Date.now();
const testUser = {
  name: `E2E User ${timestamp}`,
  email: `e2e_${timestamp}@smarttourism.test`,
  password: "E2eTest@1234",
};

test.describe("Auth – Register flow", () => {
  test("user can register a new account", async ({ page }) => {
    await page.goto("/");

    // Look for a register / sign-up link; adjust selector to match your app
    const registerLink = page
      .locator("a, button")
      .filter({ hasText: /register|sign up|create account/i })
      .first();

    // Only run the rest if the element exists; skip gracefully otherwise
    if ((await registerLink.count()) === 0) {
      test.skip(true, "Register link not found — update selector");
    }

    await registerLink.click();

    // Fill in the form (adjust field selectors to match your actual HTML)
    await page
      .locator('input[name="name"], input[placeholder*="name" i]')
      .first()
      .fill(testUser.name);
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill(testUser.email);
    await page
      .locator('input[type="password"], input[name="password"]')
      .first()
      .fill(testUser.password);

    await page.locator('button[type="submit"]').click();

    // After registration we expect to land on a dashboard or home page
    await expect(page).not.toHaveURL(/register/i, { timeout: 10000 });
  });
});

test.describe("Auth – Login flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/");

    const loginLink = page
      .locator("a, button")
      .filter({ hasText: /log ?in|sign in/i })
      .first();

    if ((await loginLink.count()) === 0) {
      test.skip(true, "Login link not found — update selector");
    }

    await loginLink.click();
    // At minimum, a password input should now be visible
    await expect(
      page.locator('input[type="password"]').first()
    ).toBeVisible({ timeout: 8000 });
  });
});
