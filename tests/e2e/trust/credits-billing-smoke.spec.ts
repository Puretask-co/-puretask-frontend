import { test, expect } from '@playwright/test';

const CLIENT_EMAIL = process.env.TEST_EMAIL || 'client@test.com';
const CLIENT_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';

test.describe('Credits/Billing smoke journey', () => {
  test('client can access credits and billing trust pages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill(CLIENT_EMAIL);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/client(\/|$)/);

    await page.goto('/client/credits-trust');
    await expect(page.getByRole('heading', { name: /credits/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /buy credits/i })).toBeVisible();
    await expect(page.getByText(/transaction history/i)).toBeVisible();

    await page.goto('/client/billing-trust');
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();

    const invoicesHeading = page.getByRole('heading', { name: /invoices/i });
    const emptyInvoices = page.getByText(/no invoices yet/i);
    const invoiceTable = page.locator('table');
    await expect(invoicesHeading.or(emptyInvoices).or(invoiceTable)).toBeVisible();
  });
});
