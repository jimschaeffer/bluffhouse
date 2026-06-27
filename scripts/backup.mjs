#!/usr/bin/env node
// Back up the live Bluff House Social shared data to a timestamped JSON file.
// The passcode is read from ROOM_PASSCODE (env var or local .env) — never hardcoded,
// so this script is safe to live in the public repo.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://bluff-house-social.netlify.app/api/state";

function getPass() {
  if (process.env.ROOM_PASSCODE) return process.env.ROOM_PASSCODE.trim();
  const envFile = join(ROOT, ".env");
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, "utf8").match(/^\s*ROOM_PASSCODE\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return null;
}

const pass = getPass();
if (!pass) {
  console.error("✗ No passcode found. Add it to a local .env file (it's gitignored):\n    echo 'ROOM_PASSCODE=1972' >> .env");
  process.exit(1);
}

let res;
try {
  res = await fetch(API, { headers: { "x-room-pass": pass } });
} catch (e) {
  console.error("✗ Could not reach the server:", e.message);
  process.exit(1);
}
if (!res.ok) {
  console.error(`✗ Backup failed: HTTP ${res.status}${res.status === 401 ? " (wrong passcode)" : ""}`);
  process.exit(1);
}

const text = await res.text();
let doc;
try {
  doc = JSON.parse(text);
} catch {
  console.error("✗ Server did not return valid JSON; nothing written.");
  process.exit(1);
}

const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const dir = join(ROOT, "backups");
mkdirSync(dir, { recursive: true });
const file = join(dir, `bluffhouse-backup-${stamp}.json`);
writeFileSync(file, text);

const games = doc.data?.games ?? [];
const players = doc.data?.players ?? [];
const finalized = games.filter((g) => g.closedOut).length;
console.log(`✓ Backup saved: ${file}`);
console.log(`  rev ${doc.rev} · ${games.length} games (${finalized} finalized) · ${players.length} players · ${(text.length / 1024).toFixed(0)} KB`);
