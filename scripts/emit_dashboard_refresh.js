#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const sourceIndex = args.indexOf("--source");
const source =
  sourceIndex >= 0 && args[sourceIndex + 1]
    ? args[sourceIndex + 1]
    : "proof/tower_sync_summary.json";

const output = {
  phase: "tower_sync",
  generated_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  source,
  message: "dashboard_refresh_requested",
};

const outPath = path.join("proof", "tower_dashboard_refresh.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Dashboard refresh emitted → ${outPath}`);
