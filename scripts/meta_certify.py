#!/usr/bin/env python3
"""
Meta-certify runtime bundle + pre-cert artifacts.
Validates hash lineage, timestamp bounds, and emits a consolidated meta-hash.
"""
import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path


FIVE_MINUTES = 5 * 60


def parse_ts(value: str) -> dt.datetime:
  if not value:
    raise ValueError("Missing timestamp value")
  if value.endswith("Z"):
    value = value[:-1] + "+00:00"
  return dt.datetime.fromisoformat(value)


def read_json(path: Path) -> dict:
  if not path.exists():
    raise FileNotFoundError(f"Missing artifact: {path}")
  with path.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def sha256_file(path: Path) -> str:
  digest = hashlib.sha256()
  with path.open("rb") as handle:
    for chunk in iter(lambda: handle.read(8192), b""):
      digest.update(chunk)
  return digest.hexdigest()


def verify_bundle(bundle: dict, bundle_path: Path) -> dict:
  proofs = bundle.get("proofs", [])
  if not proofs:
    raise ValueError("Bundle contains no proofs")

  normalized = []
  for entry in proofs:
    proof_path = Path(entry["name"])
    if not proof_path.exists():
      raise FileNotFoundError(f"Proof missing: {proof_path}")
    actual_sha = sha256_file(proof_path)
    recorded_sha = entry.get("sha256")
    if actual_sha != recorded_sha:
      raise ValueError(f"Hash mismatch for {proof_path}: expected {recorded_sha}, got {actual_sha}")
    normalized.append(
      {
        "name": entry["name"],
        "sha256": recorded_sha,
        "phase": entry.get("phase"),
        "generated_at": entry.get("generated_at"),
      }
    )

  normalized.sort(key=lambda item: item["name"])
  recomputed_bundle = hashlib.sha256(json.dumps(normalized, sort_keys=True).encode("utf-8")).hexdigest()
  recorded_bundle = bundle.get("bundle_sha256")
  if recomputed_bundle != recorded_bundle:
    raise ValueError(
      f"Bundle digest mismatch: expected {recorded_bundle}, got {recomputed_bundle}"
    )

  timestamps = [parse_ts(item["generated_at"]) for item in normalized]
  phases = {item.get("phase") for item in normalized}
  return {
    "proofs": normalized,
    "timestamps": timestamps,
    "phases": phases,
    "recorded_sha": recorded_bundle,
    "created_at": parse_ts(bundle["bundle_created_at"]),
  }


def verify_precert(pre_cert: dict, expected_bundle_sha: str, bundle_path: Path) -> dt.datetime:
  bundle_ref = pre_cert.get("bundle", {})
  if Path(bundle_ref.get("path", "")) != bundle_path:
    raise ValueError("Pre-cert bundle path reference mismatch")
  if bundle_ref.get("sha256") != expected_bundle_sha:
    raise ValueError(
      f"Pre-cert references bundle sha {bundle_ref.get('sha256')}, expected {expected_bundle_sha}"
    )
  pre_cert_sha = hashlib.sha256(json.dumps(pre_cert, sort_keys=True).encode("utf-8")).hexdigest()
  seal = pre_cert.get("seal")
  if seal != hashlib.sha256(expected_bundle_sha.encode()).hexdigest():
    raise ValueError("Pre-cert seal does not match bundle sha256 fingerprint")
  return parse_ts(pre_cert["generated_at"]), pre_cert_sha


def assert_timestamp_window(pre_cert_ts: dt.datetime, bundle_info: dict) -> int:
  latest = max(bundle_info["timestamps"])
  earliest = min(bundle_info["timestamps"])
  span = int((latest - earliest).total_seconds())
  if span > FIVE_MINUTES:
    raise ValueError(f"Proof timestamp span exceeds ±5m window: {span} seconds")

  bundle_created = bundle_info["created_at"]
  if abs((bundle_created - earliest).total_seconds()) > FIVE_MINUTES:
    raise ValueError("Bundle creation time too far from earliest proof timestamp")
  if abs((bundle_created - latest).total_seconds()) > FIVE_MINUTES:
    raise ValueError("Bundle creation time too far from latest proof timestamp")
  if abs((pre_cert_ts - bundle_created).total_seconds()) > FIVE_MINUTES:
    raise ValueError("Pre-cert generation time too far from bundle creation")
  return span


def aggregate_meta_hash(bundle_sha: str, pre_cert_sha: str, proofs: list[dict]) -> str:
  payload = {
    "bundle_sha": bundle_sha,
    "pre_cert_sha": pre_cert_sha,
    "proof_chain": [
      {"name": proof["name"], "sha256": proof["sha256"]} for proof in sorted(proofs, key=lambda p: p["name"])
    ],
  }
  return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def main(argv=None) -> int:
  parser = argparse.ArgumentParser(description="Meta-certify runtime bundle and pre-cert artifacts.")
  parser.add_argument(
    "--bundle",
    default="proof/bundles/v16_5_runtime_bundle.json",
    help="Path to the runtime proof bundle.",
  )
  parser.add_argument(
    "--pre-cert",
    default="proof/pre_cert_v16_6.json",
    help="Path to the pre-certification artifact.",
  )
  parser.add_argument(
    "--out",
    default="proof/meta_cert_v17_init.json",
    help="Output path for the meta-cert proof.",
  )
  args = parser.parse_args(argv)

  bundle_path = Path(args.bundle)
  pre_cert_path = Path(args.pre_cert)
  output_path = Path(args.out)

  bundle_doc = read_json(bundle_path)
  bundle_info = verify_bundle(bundle_doc, bundle_path)

  pre_cert_doc = read_json(pre_cert_path)
  pre_cert_ts, pre_cert_sha = verify_precert(pre_cert_doc, bundle_info["recorded_sha"], bundle_path)

  timestamp_span = assert_timestamp_window(pre_cert_ts, bundle_info)

  meta_hash = aggregate_meta_hash(bundle_info["recorded_sha"], pre_cert_sha, bundle_info["proofs"])

  output = {
    "version": "v17.0-alpha",
    "phase": "meta-cert",
    "gate": "G11",
    "generated_at": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "inputs": {
      "bundle": {
        "path": str(bundle_path),
        "sha256": bundle_info["recorded_sha"],
        "created_at": bundle_doc.get("bundle_created_at"),
      },
      "pre_cert": {
        "path": str(pre_cert_path),
        "sha256": sha256_file(pre_cert_path),
        "seal": pre_cert_doc.get("seal"),
        "generated_at": pre_cert_doc.get("generated_at"),
      },
    },
    "lineage": {
      "proofs": bundle_info["proofs"],
      "phases": sorted(bundle_info["phases"]),
      "timestamp_window_seconds": timestamp_span,
      "within_5m": timestamp_span <= FIVE_MINUTES,
    },
    "meta_hash": meta_hash,
  }

  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(json.dumps(output, indent=2))
  print(f"meta-cert generated {output_path} with meta-hash {meta_hash}")
  return 0


if __name__ == "__main__":
  sys.exit(main())
