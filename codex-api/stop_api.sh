#!/bin/zsh
set -euo pipefail
[ -f /tmp/codex-api.pid ] && kill "$(cat /tmp/codex-api.pid)" 2>/dev/null || true
rm -f /tmp/codex-api.pid

# kill any listeners on 8000 (handle multiple PIDs safely)
lsof -tiTCP:8000 -sTCP:LISTEN | xargs -n1 kill 2>/dev/null || true
sleep 1
lsof -tiTCP:8000 -sTCP:LISTEN | xargs -n1 kill -9 2>/dev/null || true

lsof -iTCP:8000 -sTCP:LISTEN -n -P || echo "✅ port 8000 is free"
