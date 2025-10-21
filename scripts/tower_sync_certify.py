#!/usr/bin/env python3
#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path


def sha(obj: dict) -> str:
  snapshot = {key: value for key, value in obj.items() if key != "meta_hash"}
  return hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode("utf-8")).hexdigest()


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(description="Emit Tower Sync governance certification seal.")
  parser.add_argument(
    "--bundle",
    default="proof/bundles/v17_tower_sync_bundle.json",
    type=Path,
    help="Path to the Tower Sync bundle descriptor.",
  )
  parser.add_argument(
    "--summary",
    default="proof/tower_sync_summary.json",
    type=Path,
    help="Path to the Tower Sync summary proof.",
  )
  parser.add_argument(
    "--out",
    default="proof/tower_sync_cert_v17.json",
    type=Path,
    help="Output path for the certification proof.",
  )
  parser.add_argument(
    "--version",
    default="v17.1",
    help="Version tag to embed in the certification seal.",
  )
  parser.add_argument(
    "--gate",
    default="G13",
    help="Governance gate identifier.",
  )
  parser.add_argument(
    "--phase",
    default="tower_certify",
    help="Certification phase identifier.",
  )
  return parser


def main(argv=None) -> None:
  parser = build_parser()
  args = parser.parse_args(argv)

  if not args.bundle.exists():
    raise SystemExit(f"Missing bundle file {args.bundle}")
  if not args.summary.exists():
    raise SystemExit(f"Missing summary proof {args.summary}")

  bundle_doc = json.loads(args.bundle.read_text())
  summary_doc = json.loads(args.summary.read_text())

  bundle_sha = bundle_doc.get("bundle_sha256")
  bundle_file_sha = hashlib.sha256(args.bundle.read_bytes()).hexdigest()
  summary_sha = summary_doc.get("sha256")

  now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
  seal_payload = {
    "version": args.version,
    "phase": args.phase,
    "gate": args.gate,
    "generated_at": now,
    "bundle": {
      "path": str(args.bundle),
      "sha256": bundle_sha,
      "file_sha256": bundle_file_sha,
      "proofs": bundle_doc.get("proofs") or [],
    },
    "summary": {
      "path": str(args.summary),
      "sha256": summary_sha,
      "kpis": summary_doc.get("kpis", {}),
    },
  }
  seal_payload["meta_hash"] = sha(seal_payload)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(seal_payload, indent=2))
  print("tower governance certified ✅")
  print(f"→ {args.out} (meta-hash {seal_payload['meta_hash']})")


if __name__ == "__main__":
  main()
