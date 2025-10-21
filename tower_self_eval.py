#!/usr/bin/env python3
"""
Qontrek v16.1 – Tower Self-Evaluation Script
Evaluates reflex performance (corr, mae, dlq) and emits proof/reflex_learning.json
"""

import os, json, statistics, datetime, math
from pathlib import Path
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")
OUT_FILE = Path("proof/reflex_learning.json")

def fetch(table, select, limit=100):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&limit={limit}&order=created_at.desc"
    r = requests.get(url, headers={
        "apikey": SERVICE_ROLE,
        "Authorization": f"Bearer {SERVICE_ROLE}"
    })
    r.raise_for_status()
    return r.json()

def corr(x, y):
    if len(x) < 2: return 0
    mean_x, mean_y = statistics.mean(x), statistics.mean(y)
    num = sum((a-mean_x)*(b-mean_y) for a,b in zip(x,y))
    den = math.sqrt(sum((a-mean_x)**2 for a in x) * sum((b-mean_y)**2 for b in y))
    return round(num/den,3) if den else 0

def mae(y_true, y_pred):
    return round(sum(abs(a-b) for a,b in zip(y_true,y_pred))/len(y_true),3)

def main():
    print("▶ Running Tower Self-Eval ...")

    # 1️⃣ Pull ops metrics
    ops = fetch("ops_metrics_daily","fq,fc,dl,cl,se_pred,se_true")
    fq, fc = [o["fq"] for o in ops], [o["fc"] for o in ops]
    se_pred = [o.get("se_pred", (o["fq"]*o["fc"])/(o["dl"]*o["cl"])) for o in ops]
    se_true = [o.get("se_true", se_pred[i]) for i in range(len(se_pred))]

    # 2️⃣ Compute metrics
    corr_val = corr(fq,fc)
    mae_val = mae(se_true,se_pred)
    print(f"Corr(FQ,FC)={corr_val}  MAE={mae_val}")

    # 3️⃣ DLQ rate
    try:
        fails = fetch("tool_events","status",1000)
        total = len(fails)
        bad = sum(1 for f in fails if f["status"]=="FAILED")
        dlq_rate = round(bad/max(total,1),3)
    except Exception:
        dlq_rate = 0.0
    print(f"DLQ rate={dlq_rate}")

    # 4️⃣ Validate
    pass_flags = {
        "corr_pass": corr_val>=0.7,
        "mae_pass": mae_val<=0.05,
        "dlq_pass": dlq_rate<=0.05
    }
    overall = all(pass_flags.values())
    print("✅ PASS" if overall else "❌ FAIL", pass_flags)

    # 5️⃣ Write proof
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    proof = {
        "ts": datetime.datetime.utcnow().isoformat()+"Z",
        "corr": corr_val,
        "mae": mae_val,
        "dlq": dlq_rate,
        "pass_flags": pass_flags,
        "overall_pass": overall
    }
    OUT_FILE.write_text(json.dumps(proof,indent=2))
    print(f"Proof written → {OUT_FILE.resolve()}")

if __name__ == "__main__":
    main()

