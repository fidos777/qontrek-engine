#!/usr/bin/env python3
import argparse
import hashlib
import json
import sys
from pathlib import Path


def load_bundle(path: Path) -> dict:
  if not path.exists():
    raise FileNotFoundError(f"Bundle not found: {path}")
  with path.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def compute_entry_digest(entry: dict) -> str:
  return hashlib.sha256(json.dumps(entry, sort_keys=True).encode("utf-8")).hexdigest()


def verify_chain(bundle: dict) -> None:
  proofs = bundle.get("proofs", [])
  if not proofs:
    raise ValueError("Bundle does not contain any proofs")

  normalized = []
  for proof in proofs:
    path = Path(proof["name"])
    if not path.exists():
      raise FileNotFoundError(f"Proof missing: {path}")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    recorded = proof.get("sha256")
    if digest != recorded:
      raise ValueError(f"Hash mismatch for {path}: expected {recorded}, got {digest}")
    normalized.append(
      {
        "name": proof["name"],
        "sha256": recorded,
        "phase": proof.get("phase"),
        "generated_at": proof.get("generated_at"),
      }
    )

  normalized.sort(key=lambda item: item["name"])
  bundle_digest = hashlib.sha256(json.dumps(normalized, sort_keys=True).encode("utf-8")).hexdigest()
  recorded_bundle = bundle.get("bundle_sha256")
  if bundle_digest != recorded_bundle:
    raise ValueError(f"Bundle digest mismatch: expected {recorded_bundle}, got {bundle_digest}")


def main(argv=None) -> int:
  parser = argparse.ArgumentParser(description="Verify proof bundle sha256 chain integrity.")
  parser.add_argument(
    "--bundle",
    default="proof/bundles/v16_5_runtime_bundle.json",
    help="Path to the bundle descriptor JSON.",
  )
  args = parser.parse_args(argv)

  bundle_path = Path(args.bundle)
  bundle = load_bundle(bundle_path)
  verify_chain(bundle)
  print("sha256 chain verified ✅")
  return 0


if __name__ == "__main__":
  sys.exit(main())
