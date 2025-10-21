#!/usr/bin/env python3
"""
Daily meta-seal rotator for Tower Sync governance bundle.
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

DEFAULT_BUNDLE = Path("proof/bundles/v17_tower_sync_bundle.json")
DEFAULT_SUMMARY = Path("proof/tower_sync_summary.json")
INTEGRITY_REPORT = Path("proof/cloud_sync_verify.json")


def sha_payload(payload: dict) -> str:
  snapshot = {k: v for k, v in payload.items() if k != "meta_hash"}
  return hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode("utf-8")).hexdigest()


def load_json(path: Path) -> dict:
  if not path.exists():
    raise SystemExit(f"Missing artifact: {path}")
  return json.loads(path.read_text())

def file_sha(path: Path) -> str:
  return hashlib.sha256(path.read_bytes()).hexdigest()


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Rotate Tower Sync meta-seal.")
  parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE, help="Tower bundle path.")
  parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY, help="Tower summary path.")
  parser.add_argument("--out", type=Path, required=True, help="Output proof path.")
  parser.add_argument("--cadence", default="daily", help="Rotation cadence label.")
  args = parser.parse_args(argv)

  bundle_doc = load_json(args.bundle)
  summary_doc = load_json(args.summary)
  integrity_doc = load_json(INTEGRITY_REPORT)

  if not integrity_doc.get("passed", False):
    raise SystemExit("Cloud parity verification failed; aborting meta-seal rotation.")

  integrity_sha = file_sha(INTEGRITY_REPORT)

  today = dt.datetime.utcnow().date().isoformat()
  payload = {
    "version": summary_doc.get("generated_at", "")[:10] or today,
    "phase": "tower_meta_rotation",
    "gate": "G16",
    "cadence": args.cadence,
    "rotated_at": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "bundle": {
      "path": str(args.bundle),
      "sha256": bundle_doc.get("bundle_sha256"),
    },
    "summary_sha256": summary_doc.get("sha256"),
    "integrity_report_sha": integrity_sha,
  }
  payload["meta_hash"] = sha_payload(payload)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(payload, indent=2))
  print(f"Meta-seal rotated → {args.out} ({payload['meta_hash']})")


if __name__ == "__main__":
  main()
