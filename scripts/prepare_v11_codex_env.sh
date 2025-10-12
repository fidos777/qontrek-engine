#!/bin/bash
# -------------------------------------------------------------
# QONTREK ENGINE — v11 Codex Environment Prep Script
# Prepares repo for Batch V11: C4 Ledger + Tower Governance Pack
# -------------------------------------------------------------
set -e

echo "🚀 Preparing environment for Codex Batch V11..."

# 1️⃣ Create new working branch
BRANCH="feat/v11-c4-ledger-tower-pack"
git checkout -b "$BRANCH" || git checkout "$BRANCH"

# 2️⃣ Scaffold required directories
mkdir -p services/ledger services/tower/routes services/tower/hooks migrations tests

# 3️⃣ Create placeholder files for Codex to overwrite safely
touch \
  migrations/0014_agentkit_deploys.sql \
  migrations/0015_vw_budget_surface.sql \
  services/ledger/etl_agentkit.py \
  services/tower/routes/g7_audit.py \
  services/tower/hooks/publish_if_ready.py \
  tests/test_g7_audit.py \
  Makefile

# 4️⃣ Add smoke test (Codex won't skip)
if [ ! -f tests/test_smoke_min.py ]; then
  echo 'def test_smoke(): assert True' > tests/test_smoke_min.py
  echo "✅ Added smoke test: tests/test_smoke_min.py"
fi

# 5️⃣ Commit baseline
git add -A
git commit -m "chore: scaffold v11 ledger+tower pack targets" || echo "No new files to commit"

# 6️⃣ Push branch
git push -u origin "$BRANCH" || echo "✅ Branch already pushed"

echo "✅ Repo prepared. You can now run Codex Batch V11 safely."
echo "Next: paste the Codex prompt in ChatGPT Codex and select branch $BRANCH."

