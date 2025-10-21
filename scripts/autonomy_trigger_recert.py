#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path


def load_json(path: Path) -> dict:
  if not path.exists():
    raise SystemExit(f"Missing file {path}")
  return json.loads(path.read_text())


def sha(payload: dict) -> str:
  return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Evaluate drift score and emit re-certification trigger.")
  parser.add_argument(
    "--score",
    default="proof/autonomy/drift_score.json",
    type=Path,
    help="Path to drift score file.",
  )
  parser.add_argument(
    "--threshold",
    default=0.2,
    type=float,
    help="Severity threshold to trigger re-certification.",
  )
  parser.add_argument(
    "--bundle",
    default="proof/bundles/v17_tower_sync_bundle.json",
    type=Path,
    help="Current bundle reference for context.",
  )
  parser.add_argument(
    "--out",
    default="proof/autonomy/recert_trigger.json",
    type=Path,
    help="Output path for trigger artifact.",
  )
  args = parser.parse_args(argv)

  score_doc = load_json(args.score)
  triggered = score_doc.get("severity", 0) >= args.threshold

  payload = {
    "phase": "autonomy",
    "generated_at": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "severity": score_doc.get("severity"),
    "classification": score_doc.get("classification"),
    "threshold": args.threshold,
    "triggered": triggered,
    "score_ref": args.score.as_posix(),
    "bundle_ref": args.bundle.as_posix(),
  }
  payload["sha256"] = sha(payload)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(payload, indent=2))
  status = "TRIGGERED" if triggered else "SKIPPED"
  print(f"Re-cert trigger {status} → {args.out}")


if __name__ == "__main__":
  main()
