#!/usr/bin/env node
/**
 * Ensure deterministic E2E users exist in backend DB.
 * This proxies to backend script so frontend CI can prepare test users.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const backendDir = path.resolve(process.cwd(), "../puretask-backend");
const scriptPath = path.join(backendDir, "scripts", "seed-e2e-users.js");

const result = spawnSync("node", [scriptPath], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("Failed to run backend e2e seed script:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
