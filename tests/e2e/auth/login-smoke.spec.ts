import { test, expect } from '@playwright/test';

test.describe('Login smoke', () => {
  test('login page renders primary auth controls', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();
  });
});
