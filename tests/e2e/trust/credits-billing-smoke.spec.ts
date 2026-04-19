import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const CLIENT_EMAIL = process.env.TEST_EMAIL || 'client@test.com';
const CLIENT_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';

type LoginPayload = {
  token?: string;
  access_token?: string;
  data?: {
    token?: string;
  };
};

test.describe('Credits/Billing smoke journey', () => {
  test('client auth can fetch credits balance and invoices', async ({ request }) => {
    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email: CLIENT_EMAIL, password: CLIENT_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();

    const loginBody = (await login.json()) as LoginPayload;
    const token = loginBody.token ?? loginBody.access_token ?? loginBody.data?.token;
    expect(token).toBeTruthy();

    const creditsRes = await request.get(`${API_BASE}/api/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(creditsRes.ok()).toBeTruthy();
    const creditsBody = await creditsRes.json();
    expect(typeof creditsBody.balance).toBe('number');
    expect(typeof creditsBody.currency).toBe('string');

    const invoicesRes = await request.get(`${API_BASE}/api/billing/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(invoicesRes.ok()).toBeTruthy();
    const invoicesBody = await invoicesRes.json();
    expect(Array.isArray(invoicesBody.invoices)).toBeTruthy();
  });
});
