import json, datetime, math
from pathlib import Path

Path("proof").mkdir(exist_ok=True)
drift = json.loads(Path("proof/predictive_drift.json").read_text())
recal = json.loads(Path("proof/recalibration_log.json").read_text())
mae = abs(drift["predictions"]["6h"] - 3.5)
rmse = math.sqrt(mae**2)
proof = {
    "timestamp": datetime.datetime.now().isoformat(),
    "mae": round(mae, 2),
    "rmse": round(rmse, 2),
    "recalibration": recal["adjustment"],
    "status": "PASS" if mae < 5 else "WARN"
}
Path("proof/predictive_integrity.json").write_text(json.dumps(proof, indent=2))
print("✅ predictive_integrity.json created.")

