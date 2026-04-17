// playwright.config.ts
// Playwright configuration for E2E tests

import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const FRONTEND_BASE_URL =
  process.env.E2E_BASE_URL || process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || '3001');
const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || '4000');

const backendDirCandidates = [
  process.env.E2E_BACKEND_WORKDIR,
  path.resolve(process.cwd(), '../puretask-backend'),
  path.resolve(process.cwd(), 'puretask-backend'),
].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()));

const BACKEND_WORKDIR =
  backendDirCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'package.json'))) ||
  path.resolve(process.cwd(), '../puretask-backend');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: FRONTEND_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: `cd "${BACKEND_WORKDIR}" && npm run dev`,
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      port: FRONTEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

