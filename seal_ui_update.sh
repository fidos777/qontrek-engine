#!/usr/bin/env bash
set -euo pipefail

ROOT="${HOME}/Documents/qontrek-engine"
UI="${ROOT}/cockpit-ui"
PROOF="${ROOT}/proof"
MANIFEST="${ROOT}/manifest_frontend_v19_1.yaml"
EMBED="${ROOT}/scripts/proof_embed_shas.py"

# Preflight checks
command -v jq >/dev/null || { echo "❌ 'jq' not found"; exit 1; }
command -v python3 >/dev/null || { echo "❌ 'python3' not found"; exit 1; }
[[ -f "${EMBED}" ]] || { echo "❌ Missing ${EMBED}"; exit 1; }
[[ -f "${MANIFEST}" ]] || { echo "❌ Missing ${MANIFEST}"; exit 1; }
mkdir -p "${PROOF}"

# 1) UI build (skip if .next exists but allow rebuild)
cd "${UI}"
if [[ ! -d ".next" ]]; then
  echo "🛠  Building Cockpit UI…"
  npm run build
else
  echo "ℹ️  .next exists — skipping build (run 'npm run build' manually if needed)"
fi

# 2) Seal proof for ui_update
cd "${ROOT}"
jq -n --arg ts "$(date -u +%FT%TZ)" \
  '{phase:"ui_update", result:"ok", generated_at:$ts}' \
  > "${PROOF}/ui_build_v19_1.json"
echo "✅ Wrote ${PROOF}/ui_build_v19_1.json"

# 3) QA tests (only if test script exists)
cd "${UI}"
if jq -e '.scripts.test' package.json >/dev/null 2>&1; then
  echo "🧪 Running QA tests…"
  npm test -- --watchAll=false
  jq -n --arg ts "$(date -u +%FT%TZ)" \
    '{phase:"qa_proof", tests:"passed", generated_at:$ts}' \
    > "${PROOF}/qa_v19_1.json"
  echo "✅ Wrote ${PROOF}/qa_v19_1.json"
else
  echo "⚠️  No 'test' script in package.json — skipping QA proof"
fi

# 4) Certification
cd "${ROOT}"
python3 "${EMBED}" \
  --manifest "${MANIFEST}" \
  --output "${PROOF}/v19_1_frontend_certification.json"
echo "✅ Wrote ${PROOF}/v19_1_frontend_certification.json"

# 5) Seal
tmp="$(mktemp)"
jq '. + {status:"sealed", gate:"G19.1"}' \
  "${PROOF}/v19_1_frontend_certification.json" > "${tmp}" \
  && mv "${tmp}" "${PROOF}/v19_1_frontend_certification.json"
echo "🔏 Sealed certification → ${PROOF}/v19_1_frontend_certification.json"

echo "🎉 Done: ui_update proof, QA (if available), certification & seal."

