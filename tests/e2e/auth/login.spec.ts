// tests/e2e/auth/login.spec.ts
// E2E test for complete login flow

import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  const baseFormErrorSelector = '#main-content [role="alert"]';
  const emailInput = 'input[name="email"]';
  const passwordInput = 'input[name="password"]';
  const submitButton = 'button[type="submit"]';

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator(emailInput)).toBeVisible();
    await expect(page.locator(passwordInput)).toBeVisible();
    await expect(page.locator(submitButton)).toContainText(/sign in/i);
  });

  test('should show validation errors for empty submission', async ({ page }) => {
    await page.locator(submitButton).click();

    const emailValidationMessage = await page
      .locator(emailInput)
      .evaluate((el) => (el as HTMLInputElement).validationMessage);
    const passwordValidationMessage = await page
      .locator(passwordInput)
      .evaluate((el) => (el as HTMLInputElement).validationMessage);

    expect(emailValidationMessage.length).toBeGreaterThan(0);
    expect(passwordValidationMessage.length).toBeGreaterThan(0);
  });

  test('should successfully login as client', async ({ page }) => {
    await page.locator(emailInput).fill('client@test.com');
    await page.locator(passwordInput).fill('TestPass123!');
    await page.locator(submitButton).click();

    await expect(page).toHaveURL(/\/client(\/|$)/);
  });

  test('should successfully login as cleaner', async ({ page }) => {
    await page.locator(emailInput).fill('cleaner@test.com');
    await page.locator(passwordInput).fill('TestPass123!');
    await page.locator(submitButton).click();

    await expect(page).toHaveURL(/\/cleaner(\/|$)/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.locator(emailInput).fill('wrong@test.com');
    await page.locator(passwordInput).fill('WrongPassword!');
    await page.locator(submitButton).click();

    await expect(page.locator(baseFormErrorSelector)).toContainText(/invalid|failed|incorrect/i);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('should remember email on failed login attempt', async ({ page }) => {
    const email = 'test@test.com';
    await page.locator(emailInput).fill(email);
    await page.locator(passwordInput).fill('WrongPassword');
    await page.locator(submitButton).click();

    await expect(page.locator(emailInput)).toHaveValue(email);
  });
});

