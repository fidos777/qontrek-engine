#!/bin/bash
echo "🧩 Voltek Upload Runtime Initiated..."
source ~/Documents/qontrek-engine/.venv/bin/activate
cd ~/Documents/qontrek-engine
python3 convert_voltek_fixtures.py
curl -s -X POST http://localhost:3000/api/tower/seal-review -d '{"gate":"G19.9"}' \
  -H "Content-Type: application/json"
echo "✅ Proof regeneration + Tower seal completed."
