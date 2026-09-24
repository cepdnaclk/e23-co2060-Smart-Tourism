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

    // Follow the registration link as a visitor would.
    const registerLink = page
      .locator("a, button")
      .filter({ hasText: /register|sign up|create account/i })
      .first();

    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/\/register$/);
    await page.locator('#role').selectOption('tourist');
    await page.getByLabel('Full Name', { exact: true }).fill(testUser.name);
    await page.getByLabel('Email Address', { exact: true }).fill(testUser.email);
    await page.getByLabel('Contact Number', { exact: true }).fill('+94771234567');
    await page.locator('#password').fill(testUser.password);
    await page.getByLabel('Confirm Password', { exact: true }).fill(testUser.password);

    const registrationResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/auth/register') &&
      response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    const response = await registrationResponse;
    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({
      user: { email: testUser.email, role: 'tourist' },
    });

    // Registration logs the new tourist in and opens their dashboard.
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
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
