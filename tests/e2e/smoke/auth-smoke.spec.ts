import { expect, test } from '@playwright/test';

test.describe('Auth smoke flow', () => {
  const emailInput = 'input[name="email"]';
  const passwordInput = 'input[name="password"]';
  const submitButton = 'button[type="submit"]';

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('renders login form controls', async ({ page }) => {
    await expect(page.locator(emailInput)).toBeVisible();
    await expect(page.locator(passwordInput)).toBeVisible();
    await expect(page.locator(submitButton)).toContainText(/sign in/i);
  });

  test('enforces required fields for login', async ({ page }) => {
    await page.locator(submitButton).click();

    const emailMessage = await page.locator(emailInput).evaluate((el) => (el as HTMLInputElement).validationMessage);
    const passwordMessage = await page
      .locator(passwordInput)
      .evaluate((el) => (el as HTMLInputElement).validationMessage);

    expect(emailMessage.length).toBeGreaterThan(0);
    expect(passwordMessage.length).toBeGreaterThan(0);
  });

  test('navigates to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('navigates to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});
