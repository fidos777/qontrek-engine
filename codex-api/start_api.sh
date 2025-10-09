#!/bin/zsh
set -euo pipefail
cd ~/voltek-prompts/codex-api
source .venv/bin/activate

# free port first
lsof -tiTCP:8000 -sTCP:LISTEN | xargs -I{} kill {} 2>/dev/null || true
sleep 1
lsof -tiTCP:8000 -sTCP:LISTEN | xargs -I{} kill -9 {} 2>/dev/null || true

nohup uvicorn main:app --host 127.0.0.1 --port 8000 --reload \
  >/tmp/codex-api.log 2>&1 & echo $! >/tmp/codex-api.pid
echo "PID: $(cat /tmp/codex-api.pid)"

# wait until healthy
for i in {1..30}; do
  curl -s http://127.0.0.1:8000/healthz | grep -q '"status":"ok"' && { echo "✅ up"; exit 0; }
  sleep 1
done
echo "❌ server not up, see /tmp/codex-api.log"
exit 1
