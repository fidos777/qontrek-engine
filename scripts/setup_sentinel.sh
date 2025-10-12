#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating sentinel test, workflow, and issue template…"

# --- 0) Ensure dirs ---
mkdir -p tests .github/ISSUE_TEMPLATE .github/workflows flows/js

# --- 1) Sentinel pytest (fails on main/PR->main if Option B fixtures exist) ---
cat > tests/test_sentinel_fixtures.py <<'PY'
import os, glob, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

def _branch():
    try:
        b = subprocess.check_output(["git","rev-parse","--abbrev-ref","HEAD"], text=True).strip()
    except Exception:
        b = os.getenv("GITHUB_REF_NAME","")
    return b

def _is_main_context():
    b = _branch()
    if b in ("main","master"):
        return True
    # GitHub Actions PRs
    if os.getenv("GITHUB_BASE_REF","") in ("main","master"):
        return True
    # Safety: allow forcing check via env even off-main
    if os.getenv("ENFORCE_OPTION_B_SENTINEL","") == "1":
        return True
    return False

def _fixtures_exist():
    files = []
    files += glob.glob(str(ROOT / "flows/js/*.js"))
    files += glob.glob(str(ROOT / "flows/send_meter.json"))
    return len(files) > 0, files

def test_option_b_fixtures_block_main():
    exists, files = _fixtures_exist()
    if not exists:
        return
    if not _is_main_context():
        # Allow on feature branches
        return
    msg = [
        "Option B local fixtures detected on main/PR->main. Block release.",
        "Files:",
        *[f" - {f}" for f in files],
        "",
        "Action: migrate to Option A (submodule) then remove these files.",
    ]
    raise AssertionError("\n".join(msg))
PY

# --- 2) GitHub Action: block merges when fixtures exist ---
cat > .github/workflows/deny_option_b_on_main.yml <<'YML'
name: Block Option B fixtures on main
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fail if flows local fixtures are present
        run: |
          set -e
          HIT=0
          ls flows/js/*.js >/dev/null 2>&1 && HIT=1 || true
          test -f flows/send_meter.json && HIT=1 || true
          if [ "$HIT" = "1" ]; then
            echo "::error ::Option B fixtures detected (flows/js/*.js or flows/send_meter.json). Migrate to submodule (Option A) before merging."
            exit 1
          fi
YML

# --- 3) Issue template: “Migrate fixtures to Option A” ---
cat > .github/ISSUE_TEMPLATE/migrate_to_option_a.yml <<'YML'
name: Migrate flows fixtures to Option A (submodule)
description: Replace local Option B fixtures with official flows submodule
title: "Migrate: flows fixtures → submodule (Option A)"
labels: ["tech-debt","governance","G7"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        This ticket replaces local **Option B** fixtures with the official **flows** submodule.
  - type: checkboxes
    id: tasks
    attributes:
      label: Tasks
      options:
        - label: "Create/point .gitmodules → flows repo URL"
        - label: "git submodule add/update & checkout GOOD_SHA"
        - label: "Remove local fixtures (flows/js/*.js, flows/send_meter.json)"
        - label: "Run pytest -q (expect green)"
        - label: "Verify Action ‘Block Option B fixtures’ passes"
        - label: "Close ticket & link PR"
  - type: input
    id: repo
    attributes:
      label: flows repo URL
      placeholder: "git@github.com:<org>/<flows-repo>.git"
  - type: input
    id: sha
    attributes:
      label: GOOD_SHA (commit containing fixtures)
      placeholder: "abcdef123456…"
YML

# --- 4) README header (prepend if not present) ---
FIX_HDR=$'> ⚠️ **Temporary Local Fixtures (Option B)**\n> Guarded by `tests/test_sentinel_fixtures.py` — CI will fail on `main` if these files still exist.\n> Replace with official `flows` submodule once upstream is ready (see `.github/ISSUE_TEMPLATE/migrate_to_option_a.yml`).\n'
README="flows/LOCAL_FIXTURES_README.md"
if [ -f "$README" ]; then
  if ! grep -q "Temporary Local Fixtures (Option B)" "$README"; then
    tmp="$(mktemp)"
    printf "%s\n\n" "$FIX_HDR" > "$tmp"
    cat "$README" >> "$tmp"
    mv "$tmp" "$README"
  fi
else
  printf "%s\n" "$FIX_HDR" > "$README"
  cat >> "$README" <<'MD'

These JS/JSON files are **temporary test stubs** to unblock CI while we wait for the official `flows` submodule.

Tracked files:
- flows/js/payload_builder.js
- flows/js/resolve_locale.js
- flows/js/phone_check.js
- flows/js/status_check.js
- flows/send_meter.json
MD
fi

echo "==> Done. Now: git add, commit, and push."
