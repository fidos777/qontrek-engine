import json, datetime
from pathlib import Path

Path("proof").mkdir(exist_ok=True)
drift = json.loads(Path("proof/predictive_drift.json").read_text())
delta = drift["predictions"]["6h"] - 3.5
log = {
    "timestamp": datetime.datetime.now().isoformat(),
    "adjustment": f"{'+' if delta>0 else ''}{round(delta,2)}%",
    "reason": "Auto recalibration based on predictive drift"
}
Path("proof/recalibration_log.json").write_text(json.dumps(log, indent=2))
print("✅ recalibration_log.json created.")

