#!/usr/bin/env bash
echo "--- API Adaptor Routes ---"
for p in \
  cockpit-ui/app/api/gates/g2/summary/route.ts \
  cockpit-ui/app/api/gates/g1/summary/route.ts \
  cockpit-ui/app/api/gates/g0/summary/route.ts \
  cockpit-ui/app/api/cfo/summary/route.ts \
  cockpit-ui/app/api/docs/summary/route.ts
do
  if test -f "$p"; then
    echo "✅ $p"
  else
    echo "🔴 MISSING $p"
  fi
done
echo "=== END ==="

