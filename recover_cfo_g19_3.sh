#!/bin/bash
# ============================================
# QONTREK FACTORY RECOVERY: CFO LENS G19.3
# Safely stash, rebase, and push parallel Codex outputs
# ============================================

set -e  # exit on error
echo "🚀 Starting Qontrek Factory Recovery for G19.3 (CFO Lens)..."

# --- 1️⃣ Snapshot current Codex outputs
echo "📦 Creating safety commit for Codex parallel outputs..."
git add cockpit-ui/app/cfo cockpit-ui/tests/fixtures cockpit-ui/__tests__/cfo.* cockpit-ui/README.md || true
git add proof/ scripts/ config/ || true

if git diff --cached --quiet; then
  echo "⚪ No staged changes detected — skipping commit."
else
  git commit -m "feat(cockpit-ui): snapshot Codex parallel CFO Lens (G19.3) outputs"
fi

# --- 2️⃣ Stash remaining temp/untracked files
echo "🧰 Stashing residual local files..."
git stash push -m "temp local Codex artifacts (G19.3)" || true

# --- 3️⃣ Sync with main safely
echo "🔄 Pulling latest main branch with rebase..."
git pull origin main --rebase

# --- 4️⃣ Restore CFO Lens outputs
echo "📤 Restoring CFO Lens files from stash..."
git stash pop || true

# --- 5️⃣ Create a clean feature branch
echo "🌿 Creating branch feat/cfo-lens-g19.3..."
git checkout -b feat/cfo-lens-g19.3 || git switch feat/cfo-lens-g19.3

# --- 6️⃣ Add all relevant CFO files for PR
echo "🧩 Staging CFO Lens implementation..."
git add cockpit-ui/app/cfo cockpit-ui/tests/fixtures cockpit-ui/__tests__/cfo.* cockpit-ui/README.md proof/ scripts/ config/ || true

git commit -m "feat(cockpit-ui): implement CFO Lens 5-Tab Dashboard + API route (G19.3)" || echo "⚪ No new changes to commit."

# --- 7️⃣ Push to remote
echo "🚀 Pushing feature branch to GitHub..."
git push -u origin feat/cfo-lens-g19.3

# --- 8️⃣ Print next manual steps
echo ""
echo "✅ CFO Lens (G19.3) recovery complete!"
echo "Next:"
echo "  1. Open Pull Request → target: main"
echo "  2. Merge after CI passes"
echo "  3. Tag release:"
echo "       git tag -a g19.3-cfo -m 'CFO Lens Dashboard merged & sealed'"
echo "       git push origin g19.3-cfo"
echo "  4. Confirm lineage update via Tower: proof/lineage.json"
echo ""
echo "🟢 Factory ready for G19.4 (Document Tracker)."

