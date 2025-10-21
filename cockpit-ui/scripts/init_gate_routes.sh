#!/usr/bin/env bash
set -euo pipefail

ROOT="cockpit-ui/app/api"
mkdir -p "$ROOT/gates/g0/summary" "$ROOT/gates/g1/summary" "$ROOT/gates/g2/summary"
mkdir -p "$ROOT/cfo/summary" "$ROOT/docs/summary"

template_route() {
  local outfile="$1" json_rel="$2"
  cat > "$outfile" <<'TS'
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const ENV_DIR = process.env.PROOF_REAL_DIR;
const FALLBACK_ROOT = path.join(process.cwd(), "proof");

async function readJson(relPath: string) {
  if (ENV_DIR) {
    try {
      const p = path.join(ENV_DIR, relPath);
      const raw = await fs.readFile(p, "utf8");
      return { data: JSON.parse(raw), source: "real", path: p };
    } catch {}
  }
  try {
    const p = path.join(FALLBACK_ROOT, relPath);
    const raw = await fs.readFile(p, "utf8");
    return { data: JSON.parse(raw), source: "fallback", path: p };
  } catch (err) {
    return { error: String(err), source: "none" };
  }
}

export async function GET() {
  const rel = "__REL__";
  const res = await readJson(rel);
  if ((res as any).error) {
    return NextResponse.json(
      { ok: false, error: (res as any).error, rel },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, rel, ...res });
}
TS
  sed -i.bak "s#__REL__#${json_rel}#g" "$outfile" && rm -f "${outfile}.bak"
  echo "✅ Wrote $outfile -> $json_rel"
}

# Gate 2
template_route "$ROOT/gates/g2/summary/route.ts" "g2_dashboard_v19.1.json"
# Gate 1
template_route "$ROOT/gates/g1/summary/route.ts" "g1_dashboard_v19.1.json"
# Gate 0
template_route "$ROOT/gates/g0/summary/route.ts" "g0_dashboard_v19.1.json"
# CFO
template_route "$ROOT/cfo/summary/route.ts" "cfo/cfo_fulltabs_v19.1.json"
# Docs tracker
template_route "$ROOT/docs/summary/route.ts" "dashboard/docs_tracker_v19.1.json"

echo "✨ All routes scaffolded. Remember to set PROOF_REAL_DIR in .env.local"

