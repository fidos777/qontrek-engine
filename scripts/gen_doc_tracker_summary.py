#!/usr/bin/env python3
"""
Generate Doc Tracker governance proof (Sprint B).
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


SUMMARY_PATH = Path("proof/tower_sync_summary.json")
NOTIFY_PATH = Path("proof/notify_events.json")
OUTPUT_PATH = Path("proof/doc_tracker_summary.json")


def utc_now() -> str:
  return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    return {}
  try:
    return json.loads(path.read_text())
  except json.JSONDecodeError:
    return {}


def seed_rng(summary: Dict[str, Any]) -> random.Random:
  seed_basis = summary.get("sha256") or summary.get("generated_at") or str(time.time())
  seed = hashlib.sha256(seed_basis.encode("utf-8")).hexdigest()
  return random.Random(int(seed[:16], 16))


def synthesize_documents(rng: random.Random) -> List[Dict[str, Any]]:
  templates = [
    ("KYC Packet", "tenant-emea", "preboarding", "A. Hassan"),
    ("Vendor Contract", "tenant-apac", "renewal", "S. Chen"),
    ("Policy Update", "tenant-west", "compliance", "L. Rivera"),
    ("Security Questionnaire", "tenant-emea", "risk", "M. Patel"),
    ("Change Order", "tenant-apac", "expansion", "D. Silva"),
  ]
  statuses = []
  for name, tenant, project, owner in templates:
    age_days = rng.randint(3, 35)
    sla_tiers = [7, 14, 21, 30]
    tier_hits = [threshold for threshold in sla_tiers if age_days > threshold]
    severity = "green"
    status = "on_track"
    if age_days > 21:
      severity = "red"
      status = "escalated"
    elif age_days > 14:
      severity = "amber"
      status = "warning"
    next_action = rng.choice(
      [
        "Awaiting customer signature",
        "Legal review in progress",
        "Escalate to finance control tower",
        "Resend reminder via WhatsApp",
      ]
    )
    channel = "whatsapp" if severity == "red" else "slack"
    statuses.append(
      {
        "doc_id": f"DOC-{hashlib.sha1(name.encode('utf-8')).hexdigest()[:6].upper()}",
        "document": name,
        "tenant": tenant,
        "project": project,
        "owner": owner,
        "age_days": age_days,
        "sla_tiers": sla_tiers,
        "sla_breached": tier_hits,
        "status": status,
        "severity": severity,
        "next_action": next_action,
        "channel": channel,
      }
    )
  return statuses


def extract_alerts(events_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
  events = events_doc.get("events") or []
  alerts = []
  for entry in reversed(events[-5:]):
    alerts.append(
      {
        "generated_at": entry.get("generated_at"),
        "channel": entry.get("channel"),
        "severity": entry.get("severity"),
        "action": entry.get("action"),
        "result": entry.get("result", {}).get("status"),
      }
    )
  return alerts


def compute_summary(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
  total = len(documents)
  escalated = sum(1 for doc in documents if doc["severity"] == "red")
  warnings = sum(1 for doc in documents if doc["severity"] == "amber")
  sla_scores = []
  for doc in documents:
    max_tier = max(doc["sla_tiers"])
    breaching = len(doc["sla_breached"])
    score = max(0, 100 - (breaching / max_tier) * 100)
    sla_scores.append(score)
  sla_index = max(0, min(100, round(statistics.mean(sla_scores), 1))) if sla_scores else 100
  return {
    "total_documents": total,
    "escalated": escalated,
    "warnings": warnings,
    "sla_health_index": sla_index,
    "next_review_at": utc_now(),
  }


def sha_payload(payload: Dict[str, Any]) -> str:
  snapshot = {k: v for k, v in payload.items() if k != "sha256"}
  return hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode("utf-8")).hexdigest()


def main() -> None:
  summary_doc = read_json(SUMMARY_PATH)
  notify_doc = read_json(NOTIFY_PATH)
  rng = seed_rng(summary_doc)

  documents = synthesize_documents(rng)
  alerts = extract_alerts(notify_doc)
  summary = compute_summary(documents)

  payload: Dict[str, Any] = {
    "phase": "doc_tracker",
    "generated_at": utc_now(),
    "tenant_id": os.getenv("SUPABASE_TENANT_ID"),
    "summary": summary,
    "documents": documents,
    "alerts": alerts,
    "meta": {
      "source": "scripts/gen_doc_tracker_summary.py",
      "inputs": [str(SUMMARY_PATH), str(NOTIFY_PATH)],
    },
  }
  payload["sha256"] = sha_payload(payload)

  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  OUTPUT_PATH.write_text(json.dumps(payload, indent=2))
  print(f"Doc tracker summary generated → {OUTPUT_PATH} ({payload['sha256']})")


if __name__ == "__main__":
  main()
