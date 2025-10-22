// scripts/checkCoverage.js
// CI coverage enforcement script

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coveragePath = path.join(__dirname, "../coverage/coverage-summary.json");

// Get minimum coverage from args (default 90%)
const args = process.argv.slice(2);
const minArg = args.find((arg) => arg.startsWith("--min="));
const minCoverage = minArg ? Number(minArg.split("=")[1]) : 90;

try {
  // Check if coverage file exists
  if (!fs.existsSync(coveragePath)) {
    console.error("❌ Coverage file not found:", coveragePath);
    console.error("   Run `npm test -- --coverage` first");
    process.exit(1);
  }

  // Read coverage data
  const data = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  const total = data.total;

  // Extract coverage percentages
  const linePct = total.lines.pct;
  const stmtPct = total.statements.pct;
  const funcPct = total.functions.pct;
  const branchPct = total.branches.pct;

  console.log("\n📊 Coverage Report:");
  console.log(`   Lines:      ${linePct.toFixed(2)}%`);
  console.log(`   Statements: ${stmtPct.toFixed(2)}%`);
  console.log(`   Functions:  ${funcPct.toFixed(2)}%`);
  console.log(`   Branches:   ${branchPct.toFixed(2)}%`);
  console.log(`\n   Minimum Required: ${minCoverage}%`);

  // Check if all coverage metrics meet minimum
  if (
    linePct >= minCoverage &&
    stmtPct >= minCoverage &&
    funcPct >= minCoverage &&
    branchPct >= minCoverage
  ) {
    console.log(`\n✅ Coverage check passed! All metrics ≥ ${minCoverage}%\n`);
    process.exit(0);
  } else {
    console.error(`\n❌ Coverage check failed! Some metrics < ${minCoverage}%`);
    console.error("   Please add tests to improve coverage.\n");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Error checking coverage:", error.message);
  process.exit(1);
}
