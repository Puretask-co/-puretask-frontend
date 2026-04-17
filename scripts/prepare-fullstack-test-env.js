#!/usr/bin/env node
/**
 * Prepare local frontend .env.local for full-stack tests.
 * Idempotent: only writes missing keys and preserves existing values.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envLocalPath = path.join(root, ".env.local");

const defaults = {
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
  NEXT_PUBLIC_API_URL: "http://localhost:4000",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3001",
  NEXT_PUBLIC_WS_URL: "ws://localhost:4000",
};

function parseEnvFile(content) {
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1);
    map[k] = v;
  }
  return map;
}

function main() {
  const exists = fs.existsSync(envLocalPath);
  const existing = exists ? fs.readFileSync(envLocalPath, "utf8") : "";
  const parsed = parseEnvFile(existing);

  const additions = [];
  for (const [k, v] of Object.entries(defaults)) {
    if (!parsed[k] || String(parsed[k]).trim() === "") {
      additions.push(`${k}=${v}`);
    }
  }

  if (!exists) {
    const content = [
      "# Auto-generated baseline for local full-stack tests",
      ...Object.entries(defaults).map(([k, v]) => `${k}=${v}`),
      "",
    ].join("\n");
    fs.writeFileSync(envLocalPath, content, "utf8");
    console.log(`✅ Created ${envLocalPath}`);
    return;
  }

  if (additions.length === 0) {
    console.log("✅ .env.local already contains required full-stack keys.");
    return;
  }

  const merged = `${existing.trimEnd()}\n\n# Added by prepare-fullstack-test-env.js\n${additions.join("\n")}\n`;
  fs.writeFileSync(envLocalPath, merged, "utf8");
  console.log(`✅ Added ${additions.length} missing keys to ${envLocalPath}`);
}

main();
