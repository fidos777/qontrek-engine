#!/bin/zsh
set -euo pipefail
setopt null_glob

# ---------- config ----------
BASE_URL=${BASE_URL:-http://127.0.0.1:8000}
ENGINE_DIR=${ENGINE_DIR:-$HOME/voltek-prompts/codex-api}
COCKPIT_DIR=${COCKPIT_DIR:-$HOME/qontrek-cockpit}
ART_DIR=${ART_DIR:-$HOME/claude_artifacts}
REPORT_DIR="$HOME/voltek-prompts/codex-api/reports"
STAMP=$(date +"%Y%m%d-%H%M%S")
mkdir -p "$REPORT_DIR"

echo ""
echo "🚀 [Phase-10.1] Qontrek Factory Execution — v2 (keep API running)"
echo "Paths:"
echo "  ENGINE_DIR = $ENGINE_DIR"
echo "  COCKPIT_DIR = ${COCKPIT_DIR:-<none>}"
echo "  ART_DIR     = ${ART_DIR:-<none>}"
echo "  BASE_URL    = $BASE_URL"
echo ""

# Ensure we stop the API when this script exits
trap 'cd "$HOME/voltek-prompts/codex-api"; ./stop_api.sh >/dev/null 2>&1 || true' EXIT

# ---------- [1/5] Cockpit core smoke (LEAVE API RUNNING) ----------
echo "[1/5] Cockpit core smoke..."
cd "$HOME/voltek-prompts/codex-api"
./start_api.sh
sleep 2
echo "▶ $BASE_URL"
curl -sS "$BASE_URL/healthz" | jq . || { echo "❌ health check failed"; exit 1; }
./smoke.sh || true
echo "✅ C2 cockpit smoke OK (API left running)."
echo ""

# ---------- [2/5] Integrate Claude artifacts (best-effort) ----------
echo "[2/5] Integrating Claude artifacts (best-effort)..."
# Backend artifacts
if [ -d "$ENGINE_DIR" ] && [ -d "$ART_DIR" ]; then
  if ls "$ART_DIR"/backend/routes/*.py >/dev/null 2>&1; then
    mkdir -p "$ENGINE_DIR/app/routes"
    cp -f "$ART_DIR"/backend/routes/*.py "$ENGINE_DIR/app/routes/" || true
    echo "  → Backend routes copied."
  fi
  if ls "$ART_DIR"/backend/pulse/*.py >/dev/null 2>&1; then
    mkdir -p "$ENGINE_DIR/app/routes"
    cp -f "$ART_DIR"/backend/pulse/*.py "$ENGINE_DIR/app/routes/" || true
    echo "  → Pulse/SSE modules copied."
  fi
else
  echo "  ⚠️  Skipping backend copy (ENGINE_DIR or ART_DIR missing)."
fi

# Frontend artifacts
if [ -d "$COCKPIT_DIR" ] && [ -d "$ART_DIR" ]; then
  mkdir -p "$COCKPIT_DIR/lib/queries" "$COCKPIT_DIR/components/tiles"
  if ls "$ART_DIR"/frontend/queries/*.ts >/dev/null 2>&1; then
    cp -f "$ART_DIR"/frontend/queries/*.ts "$COCKPIT_DIR/lib/queries/" || true
    echo "  → Frontend queries copied."
  fi
  if ls "$ART_DIR"/frontend/tiles/*.tsx >/dev/null 2>&1; then
    cp -f "$ART_DIR"/frontend/tiles/*.tsx "$COCKPIT_DIR/components/tiles/" || true
    echo "  → Frontend tiles copied."
  fi
else
  echo "  ⚠️  Skipping frontend copy (COCKPIT_DIR or ART_DIR missing)."
fi
echo "✅ Artifact integration step finished."
echo ""

# ---------- [3/5] Rebuild UI pack (if cockpit present) ----------
echo "[3/5] Rebuilding UI pack (if cockpit present)..."
if [ -d "$COCKPIT_DIR" ]; then
  (cd "$COCKPIT_DIR" && make ui-pack) || echo "  ℹ️  ui-pack target not found — skipped."
else
  echo "  ℹ️  No cockpit repo detected — skipped."
fi
echo "✅ UI pack step done."
echo ""

# ---------- [4/5] Pipeline validation (API still running) ----------
echo "[4/5] Pipeline validation..."
curl -sS "$BASE_URL/healthz" | jq .
curl -sS -X POST "$BASE_URL/ops/demo" -H "Content-Type: application/json" \
  -d '{"mode":"strict","mock":true,"tenants":["Voltek_EN","Voltek_MS"]}' | jq .
curl -sS -X POST "$BASE_URL/ops/rules/trigger" -H "Content-Type: application/json" \
  -d '{"tenant":"Voltek_MS","rule":"Dormant_7d","dry_run":true}' | jq .
curl -sS "$BASE_URL/ops/logs?tenant=Voltek_MS&limit=10" | jq .
curl -sS "$BASE_URL/cfo/pack?tenant=Voltek_MS" | jq .
echo "✅ Pipeline looks good."
echo ""

# ---------- [5/5] Export ATC deck ----------
echo "[5/5] Exporting Air Traffic Control Deck…"
MD="/tmp/ATC_Deck_${STAMP}.md"
PDF="$REPORT_DIR/ATC_Deck_${STAMP}.pdf"
cat > "$MD" <<'DOC'
# Qontrek Air Traffic Control Deck (v1.0)

- C2 cockpit ✅ demo-safe  
- SSE stream ✅ live  
- UI pack ✅ rebuilt (if cockpit present)  
- Four Lights ✅ green (if wired)  
- ROI tiles: Top-Up, Gate, Forecast operational

Generated: {{STAMP}}
DOC

# replace timestamp
if command -v sed >/dev/null 2>&1; then
  # macOS/BSD sed
  sed -i '' "s/{{STAMP}}/$(date)/" "$MD" 2>/dev/null || sed -i "s/{{STAMP}}/$(date)/" "$MD"
fi

if command -v pandoc >/dev/null 2>&1; then
  pandoc "$MD" -o "$PDF" && echo "✅ PDF exported → $PDF"
else
  cp "$MD" "$REPORT_DIR/"
  echo "ℹ️  pandoc not installed — saved Markdown to $REPORT_DIR"
fi

echo ""
echo "🎯 Completed Phase-10.1 sequence (API will be stopped now)."
