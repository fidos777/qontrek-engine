#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path
from typing import Dict, Any


def load_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    raise SystemExit(f"Missing file {path}")
  return json.loads(path.read_text())


def calculate_severity(report: Dict[str, Any]) -> float:
  severity = 0.0
  for entry in report.get("entries", []):
    if entry.get("status") == "missing_current":
      severity = max(severity, 1.0)
      continue
    if entry.get("status") == "new_current":
      severity = max(severity, 0.6)
      continue
    delta_success = abs(float(entry.get("delta_success_rate") or 0))
    delta_retry = abs(float(entry.get("delta_retry_rate") or 0))
    delta_dlq = abs(int(entry.get("delta_dlq_depth") or 0))
    component = max(delta_success * 2, delta_retry * 1.5, min(delta_dlq / 5.0, 1.0))
    severity = max(severity, component)
  return round(min(severity, 1.0), 4)


def classify(severity: float) -> str:
  if severity >= 0.8:
    return "critical"
  if severity >= 0.4:
    return "elevated"
  if severity >= 0.2:
    return "warning"
  return "normal"


def sha(payload: Dict[str, Any]) -> str:
  return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Score drift severity from drift report.")
  parser.add_argument(
    "--report",
    default="proof/autonomy/drift_report.json",
    type=Path,
    help="Path to drift report.",
  )
  parser.add_argument(
    "--out",
    default="proof/autonomy/drift_score.json",
    type=Path,
    help="Output path for drift score file.",
  )
  args = parser.parse_args(argv)

  report = load_json(args.report)
  severity = calculate_severity(report)
  classification = classify(severity)

  score = {
    "phase": "autonomy",
    "generated_at": report.get("generated_at"),
    "severity": severity,
    "classification": classification,
    "report_ref": args.report.as_posix(),
    "entries": len(report.get("entries", [])),
  }
  score["sha256"] = sha(score)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(score, indent=2))
  print(f"Drift severity {severity} ({classification}) → {args.out}")


if __name__ == "__main__":
  main()
