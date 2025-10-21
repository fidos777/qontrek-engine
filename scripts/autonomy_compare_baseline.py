#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path
from typing import Dict, Any, Tuple


def load_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    raise SystemExit(f"Missing file {path}")
  return json.loads(path.read_text())


def key_for(record: Dict[str, Any]) -> Tuple[str, str]:
  return record.get("tenant_id"), record.get("channel")


def sha(data: Dict[str, Any]) -> str:
  return hashlib.sha256(json.dumps(data, sort_keys=True).encode("utf-8")).hexdigest()


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Compare current metrics snapshot with baseline summary.")
  parser.add_argument(
    "--current",
    default="proof/autonomy/metrics_snapshot.json",
    type=Path,
    help="Path to current metrics snapshot.",
  )
  parser.add_argument(
    "--baseline",
    default="proof/tower_sync_summary.json",
    type=Path,
    help="Path to baseline summary proof.",
  )
  parser.add_argument(
    "--out",
    default="proof/autonomy/drift_report.json",
    type=Path,
    help="Output path for drift report.",
  )
  args = parser.parse_args(argv)

  current_doc = load_json(args.current)
  baseline_doc = load_json(args.baseline)

  current_map = {}
  for record in current_doc.get("records", []):
    key = key_for(record)
    if key not in current_map:
      current_map[key] = record

  baseline_map = {}
  for record in baseline_doc.get("by_tenant_channel", []):
    key = key_for(record)
    if key not in baseline_map:
      baseline_map[key] = record

  drift = []
  for key, baseline in baseline_map.items():
    current = current_map.get(key)
    if not current:
      drift.append(
        {
          "tenant_id": key[0],
          "channel": key[1],
          "status": "missing_current",
          "baseline": baseline,
        }
      )
      continue

    delta_success = float(current.get("success_rate", 0) or 0) - float(
      baseline.get("success_rate", 0) or 0
    )
    delta_retry = float(current.get("retry_rate", 0) or 0) - float(
      baseline.get("retry_rate", 0) or 0
    )
    delta_dlq = int(current.get("dlq_depth", 0) or 0) - int(baseline.get("dlq_depth", 0) or 0)

    drift.append(
      {
        "tenant_id": key[0],
        "channel": key[1],
        "status": "ok",
        "delta_success_rate": round(delta_success, 4),
        "delta_retry_rate": round(delta_retry, 4),
        "delta_dlq_depth": delta_dlq,
        "baseline_recorded_at": baseline.get("recorded_at"),
        "current_recorded_at": current.get("recorded_at"),
      }
    )

  for key, current in current_map.items():
    if key not in baseline_map:
      drift.append(
        {
          "tenant_id": key[0],
          "channel": key[1],
          "status": "new_current",
          "current": current,
        }
      )

  report = {
    "phase": "autonomy",
    "generated_at": current_doc.get("generated_at"),
    "baseline_ref": args.baseline.as_posix(),
    "current_ref": args.current.as_posix(),
    "entries": drift,
  }
  report["sha256"] = sha(report)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(report, indent=2))
  print(f"Wrote drift report with {len(drift)} entries → {args.out}")


if __name__ == "__main__":
  main()
