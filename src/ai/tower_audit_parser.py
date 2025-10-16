import json, glob, os, datetime

def aggregate_proofs():
    proof_dir = "proof"
    files = glob.glob(os.path.join(proof_dir, "*.json"))
    combined = {"timestamp": datetime.datetime.now().isoformat(), "proofs": {}}
    metrics = {"conversion": [], "refund": [], "efficiency": []}

    for f in files:
        name = os.path.basename(f)
        with open(f) as data:
            try:
                content = json.load(data)
                combined["proofs"][name] = content
                # extract metrics if present
                if "conversion_rate_change" in content:
                    metrics["conversion"].append(content["conversion_rate_change"])
                if "refund_rate" in content:
                    metrics["refund"].append(content["refund_rate"])
                if "efficiency_ratio" in content:
                    metrics["efficiency"].append(content["efficiency_ratio"])
            except Exception as e:
                print(f"⚠️ Error parsing {f}: {e}")

    # compute aggregates
    avg = lambda x: round(sum(x) / len(x), 3) if x else 0
    governance_score = round(
        (avg(metrics["conversion"]) * 0.5 + (1 - avg(metrics["refund"])) * 0.3 + avg(metrics["efficiency"]) * 0.2),
        3,
    )

    combined["metrics_summary"] = {
        "avg_conversion": avg(metrics["conversion"]),
        "avg_refund": avg(metrics["refund"]),
        "avg_efficiency": avg(metrics["efficiency"]),
        "governance_score": governance_score,
    }

    os.makedirs(proof_dir, exist_ok=True)
    out_path = os.path.join(proof_dir, "tower_audit_v13.json")
    with open(out_path, "w") as f:
        json.dump(combined, f, indent=2)

    print(f"✅ Tower Audit v13 report generated — {out_path}")
    print(f"🏁 Reflex Governance Score: {governance_score}")

if __name__ == "__main__":
    aggregate_proofs()

