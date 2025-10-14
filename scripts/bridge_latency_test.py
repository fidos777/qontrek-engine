"""
C2.1 – Bridge Parity Validator (v10.7.5-p2)
--------------------------------------------
Validates parity between MCP and AgentKit runtime telemetry.
Reads runtime artifacts from C2.0 Bridge Adapter and outputs a drift report for Tower Audit.

Usage:
  python scripts/bridge_latency_test.py --input artifacts/agentkit_runs/ --out artifacts/logs/ws_parity_test.log
"""

import os, json, glob, statistics, argparse
from datetime import datetime

def load_runs(folder):
    paths = sorted(glob.glob(os.path.join(folder, "*.json")))
    runs = []
    for p in paths:
        with open(p) as f:
            try:
                data = json.load(f)
                if isinstance(data, dict) and "runs" in data:
                    runs.extend(data["runs"])
            except Exception as e:
                print(f"⚠️  Failed to load {p}: {e}")
    return runs

def compute_parity_metrics(runs):
    if not runs:
        raise ValueError("No runs found.")
    evals = [r["eval_score"] for r in runs]
    latency = [r["latency_ms"] for r in runs]

    avg_eval = round(statistics.mean(evals), 3)
    stdev_eval = round(statistics.pstdev(evals), 4)
    avg_latency = round(statistics.mean(latency), 2)
    stdev_latency = round(statistics.pstdev(latency), 2)
    drift_pct = round((stdev_latency / avg_latency) * 100, 2) if avg_latency else 0

    status = "PASS" if drift_pct <= 1.0 and stdev_eval <= 0.03 else "WARN"

    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "avg_eval": avg_eval,
        "eval_stdev": stdev_eval,
        "avg_latency_ms": avg_latency,
        "latency_stdev_ms": stdev_latency,
        "drift_pct": drift_pct,
        "status": status,
    }

def write_log(out_path, metrics):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "a") as f:
        f.write(f"[{metrics['timestamp']}] avg_eval={metrics['avg_eval']} drift={metrics['drift_pct']}% status={metrics['status']}\n")
    print(f"🧾 Parity log written → {out_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    print("🔍 Running C2.1 Bridge Parity Validator ...")
    runs = load_runs(args.input)
    metrics = compute_parity_metrics(runs)
    write_log(args.out, metrics)

    print(f"✅ Bridge Parity Test Complete | Drift={metrics['drift_pct']}% | Eval σ={metrics['eval_stdev']} | Status={metrics['status']}")

    # Append summary to mission_v12.yaml (optional structured update)
    mission_path = "ops/mission_v12.yaml"
    os.makedirs(os.path.dirname(mission_path), exist_ok=True)
    with open(mission_path, "a") as f:
        f.write(f"\nc2_parity:\n  last_run: \"{metrics['timestamp']}\"\n  drift_pct: {metrics['drift_pct']}\n  eval_stdev: {metrics['eval_stdev']}\n  status: {metrics['status']}\n")

if __name__ == "__main__":
    main()

