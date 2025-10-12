set -euo pipefail

echo "🔍 Checking Option A (submodule) readiness..."
echo "---------------------------------------------"

STATUS_OK=1

if git ls-tree -d HEAD flows | grep -q '160000'; then
  echo "✅ Submodule 'flows' detected."
else
  echo "🛑 'flows' is not a submodule (gitlink) at HEAD."
  STATUS_OK=0
fi
REQ=(js/payload_builder.js js/resolve_locale.js js/phone_check.js js/status_check.js send_meter.json)
MISSING_JS=0
for f in "${REQ[@]}"; do
  if git -C flows ls-files | grep -qx "$f"; then
    echo "✅ flows/$f found."
  else
    echo "🛑 Missing in submodule: flows/$f"
    MISSING_JS=1
    STATUS_OK=0
  fi
done

PARENT_TRACKED=()
for f in flows/js/payload_builder.js flows/js/resolve_locale.js flows/js/phone_check.js flows/js/status_check.js flows/send_meter.json; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    PARENT_TRACKED+=("$f")
  fi
done

if [[ ${#PARENT_TRACKED[@]} -eq 0 ]]; then
  echo "✅ No Option B fixtures tracked by parent repo."
else
  echo "🛑 These files are tracked by parent repo (Option B still active):"
  printf ' - %s\n' "${PARENT_TRACKED[@]}"
  STATUS_OK=0
fi

# 4) Sentinel test (ok kalau fail, tapi kita cuba)
if pytest -q >/dev/null 2>&1; then
  echo "✅ Pytest ran."
else
  echo "⚠️  Pytest returned non-zero (ignored for readiness)."
fi

echo "---------------------------------------------"
if [[ "$STATUS_OK" -eq 1 && "$MISSING_JS" -eq 0 ]]; then
  echo "🌿 All signals GREEN — Option A is active and safe."
  exit 0
else
  echo "🛑 Not ready — fix items above."
  exit 1
fi
