#!/usr/bin/env node
/**
 * Run Playwright E2E with consistent defaults.
 * - Uses local full-stack URLs by default.
 * - Keeps auth credentials configurable via env.
 */
const { spawnSync } = require("child_process");

const env = {
  ...process.env,
  E2E_BASE_URL: process.env.E2E_BASE_URL || process.env.FRONTEND_BASE_URL || "http://localhost:3001",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:4000",
  TEST_EMAIL: process.env.TEST_EMAIL || "client@test.com",
  TEST_PASSWORD: process.env.TEST_PASSWORD || "TestPass123!",
};

const args = process.argv.slice(2);
const result = spawnSync("npx", ["playwright", "test", ...args], {
  stdio: "inherit",
  env,
});

if (result.error) {
  console.error("Failed to execute Playwright:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
