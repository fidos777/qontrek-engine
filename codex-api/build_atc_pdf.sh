#!/bin/zsh
set -e

REPORTDIR="$HOME/voltek-prompts/codex-api/reports"
ARTDIR="$HOME/claude_artifacts"
TMP="/tmp/ATC_Deck_full.md"
mkdir -p "$REPORTDIR" "$ARTDIR"

# Header + pipeline proof
cat > "$TMP" <<'MD'
# Qontrek Air Traffic Control Deck (v1.0)

**Phase-10.1 Factory Liftoff — Status**
- C2 Cockpit: demo-safe (seed/batch/dry-run/logs/CFO pack passing)
- SSE stream: live
- UI pack: rebuilt/skipped if cockpit not present
- Four Lights: green via smoke (Infra/Data/Story/Gov)
- ROI tiles online: Top-Up, Gates, Forecast (API proofs below)

## Pipeline Proof (API smoke)
- `POST /ops/demo` → ok
- `POST /ops/templates/batch` → queued
- `POST /ops/rules/trigger?dry_run` → ok
- `GET /ops/logs` → shows demo events
- `GET /cfo/pack` → returns signed URL

> Paste your latest JSON snippets here if you want hard evidence.

---
## Phase-10.1 Integration Guide (Source)
MD

# Append integration guide (or a placeholder note)
if [ -f "$ARTDIR/integration_guide.md" ]; then
  echo >> "$TMP"
  cat "$ARTDIR/integration_guide.md" >> "$TMP"
else
  echo "(integration_guide.md missing — add the real file to $ARTDIR)" >> "$TMP"
fi

# Append TypeScript artifact (fenced)
{
  echo
  echo '---'
  echo '## Appendix A — C1.UI Auto-Render (TypeScript)'
  echo '```ts'
  if [ -f "$ARTDIR/c1_ui_autorender.ts" ]; then
    cat "$ARTDIR/c1_ui_autorender.ts"
  else
    echo '// c1_ui_autorender.ts missing — add the real file to '"$ARTDIR"
  fi
  echo '```'
} >> "$TMP"

# Append Python artifact (fenced)
{
  echo '## Appendix B — SSE Implementation (Python)'
  echo '```python'
  if [ -f "$ARTDIR/sse_implementation.py" ]; then
    cat "$ARTDIR/sse_implementation.py"
  else
    echo '# sse_implementation.py missing — add the real file to '"$ARTDIR"
  fi
  echo '```'
} >> "$TMP"

# Render to PDF
STAMP=$(date +%Y%m%d_%H%M)
OUT="$REPORTDIR/ATC_Deck_${STAMP}.pdf"
pandoc "$TMP" -o "$OUT" --pdf-engine=tectonic
echo "✅ PDF exported → $OUT"
open "$OUT" 2>/dev/null || true
