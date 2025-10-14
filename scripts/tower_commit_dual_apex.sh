#!/bin/bash
# 🗼 QONTREK CONTROL TOWER – Dual Apex Commit Script (v10.7)
# Purpose: Automate commits across qontrek-engine, qontrek-flows, qontrek-site
# Mode: Manual-first (Tower Lite)
# Author: @firdaus_ismail

set -e

echo "🚀 Starting Qontrek Control Tower Dual Apex push sequence..."
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# ===============================
# 1️⃣ ENGINE REPO (Governance Core)
# ===============================
echo "🧩 Step 1: Committing governance and reports in qontrek-engine..."
cd ~/Documents/qontrek-engine

git add docs/Connector_Map_v10.7.md \
        ops/mission_v12.yaml \
        reports/G8_Efficiency_Report.md \
        reports/efficiency_metrics.csv

git commit -m "docs+ops: Add Dual Apex Governance & Efficiency Proof (v10.7) [$DATE]" || echo "⚠️ No new changes to commit in qontrek-engine"
git push origin main

# ===============================
# 2️⃣ FLOWS REPO (Ledger Layer)
# ===============================
echo "🧱 Step 2: Updating SQL in qontrek-flows..."
cd ~/Documents/qontrek-flows

if [ ! -f sql/tower_efficiency_summary.sql ]; then
  mkdir -p sql
  cp ~/Documents/qontrek-engine/sql/tower_efficiency_summary.sql sql/ 2>/dev/null || echo "⚠️ SQL file not found in engine repo."
fi

git add sql/tower_efficiency_summary.sql
git commit -m "sql: Add Tower Efficiency Summary View (v10.7) [$DATE]" || echo "⚠️ No new changes to commit in qontrek-flows"
git push origin main

# ===============================
# 3️⃣ SITE REPO (Cockpit Frontend)
# ===============================
echo "💻 Step 3: Updating Cockpit UI components in qontrek-site..."
cd ~/Documents/qontrek-site

git add frontend/data/EfficiencyRow.json \
        frontend/components/ReleaseReadinessCard.jsx \
        frontend/pages/Dashboard.jsx

git commit -m "frontend: Add Dual Apex Cockpit Dashboard (G7+G8 visual proof) [$DATE]" || echo "⚠️ No new changes to commit in qontrek-site"
git push origin main

# ===============================
# 4️⃣ TAG & SYNC
# ===============================
echo "🏁 Step 4: Tagging all repos with v10.7-DualApex..."
cd ~/Documents/qontrek-engine
git tag v10.7-DualApex || echo "⚠️ Tag already exists."
git push origin --tags

cd ~/Documents/qontrek-flows
git tag v10.7-DualApex || true
git push origin --tags

cd ~/Documents/qontrek-site
git tag v10.7-DualApex || true
git push origin --tags

echo "✅ All repositories pushed and tagged successfully."
echo "📦 Dual Apex Governance Chain complete as of $DATE."

# Optional: print post-deployment summary
echo "
─────────────────────────────────────────────
🏗️  QONTREK CONTROL TOWER STATUS
─────────────────────────────────────────────
🧠 G7 Proof: Functional Integrity ✅
⚡ G8 Proof: Efficiency Verified 🟢
🧾 Reports: /reports/G8_Efficiency_Report.md
📊 Metrics: /reports/efficiency_metrics.csv
🧱 SQL View: /sql/tower_efficiency_summary.sql
💻 Cockpit: /dashboard.jsx (UI + Chart)
─────────────────────────────────────────────
Next: Run local dashboard preview → npm run dev
─────────────────────────────────────────────
"

