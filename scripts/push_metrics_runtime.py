#!/usr/bin/env python3
import datetime as dt
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


BUNDLE_DEFAULT = "proof/bundles/v16_5_runtime_bundle.json"
OUT_PATH = Path("proof/tower_sync_ingest.json")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE = os.environ.get("SUPABASE_SERVICE_ROLE") or os.environ.get("SUPABASE_SERVICE_KEY")


def _headers_for_write() -> dict:
  if not SERVICE_ROLE or not SUPABASE_URL:
    raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var")
  return {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE,
    "Authorization": f"Bearer {SERVICE_ROLE}",
    "Prefer": "return=representation",
  }


def _post_rows(rows: list[dict]) -> list[dict]:
  rest_table = f"{SUPABASE_URL}/rest/v1/metrics_runtime"
  req = urllib.request.Request(
    rest_table,
    data=json.dumps(rows).encode("utf-8"),
    headers=_headers_for_write(),
    method="POST",
  )
  with urllib.request.urlopen(req, timeout=20) as response:
    payload = response.read().decode("utf-8")
  return json.loads(payload) if payload else []


def _sha(obj: dict) -> str:
  return hashlib.sha256(json.dumps(obj, sort_keys=True).encode("utf-8")).hexdigest()


def _load_bundle(bundle_path: str) -> dict:
  path = Path(bundle_path)
  if not path.exists():
    raise SystemExit(f"Bundle not found: {bundle_path}")
  return json.loads(path.read_text())


def _load_proof_map(bundle: dict) -> dict:
  proof_map = {Path(proof["name"]).name: proof["name"] for proof in bundle.get("proofs", [])}
  required = {
    "notify_events.json",
    "notify_dlq_snapshot.json",
    "scheduler_hardening.json",
  }
  missing = required.difference(proof_map)
  if missing:
    raise SystemExit(f"Missing proof references in bundle: {', '.join(sorted(missing))}")
  return proof_map


def _file_sha(path: Path) -> str:
  return hashlib.sha256(path.read_bytes()).hexdigest()


def _decorate_meta(bundle: dict, events_path: Path, dlq_path: Path, scheduler_path: Path) -> dict:
  return {
    "bundle_sha256": bundle.get("bundle_sha256"),
    "events_sha256": _file_sha(events_path),
    "dlq_sha256": _file_sha(dlq_path),
    "scheduler_sha256": _file_sha(scheduler_path),
  }


def main(bundle_path: str = BUNDLE_DEFAULT) -> None:
  bundle = _load_bundle(bundle_path)
  proof_map = _load_proof_map(bundle)

  events_path = Path(proof_map["notify_events.json"])
  dlq_path = Path(proof_map["notify_dlq_snapshot.json"])
  scheduler_path = Path(proof_map["scheduler_hardening.json"])

  events = json.loads(events_path.read_text())
  dlq = json.loads(dlq_path.read_text())
  scheduler = json.loads(scheduler_path.read_text())

  metrics: dict[tuple[str, str], dict[str, int]] = {}
  for event in events.get("events", []):
    tenant = event.get("tenant_id")
    channel = event.get("channel")
    if not tenant or not channel:
      continue
    key = (tenant, channel)
    stats = metrics.setdefault(key, {"total": 0, "sent": 0, "retry_hits": 0})
    stats["total"] += 1
    if event.get("status") == "sent":
      stats["sent"] += 1
    attempts = int(event.get("attempts", 0))
    if attempts > 1:
      stats["retry_hits"] += 1

  dlq_per_channel: dict[str, int] = {}
  for entry in dlq.get("entries", []):
    channel = entry.get("channel")
    if not channel:
      continue
    dlq_per_channel[channel] = dlq_per_channel.get(channel, 0) + 1

  jitter_ms = int(scheduler.get("checks", {}).get("jitter_window_ms", 0))

  now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
  rows: list[dict] = []
  for (tenant, channel), stats in metrics.items():
    total = max(stats["total"], 1)
    success_rate = round(stats["sent"] / total, 4)
    retry_rate = round(stats["retry_hits"] / total, 4)
    dlq_depth = int(dlq_per_channel.get(channel, 0))
    rows.append(
      {
        "recorded_at": now,
        "tenant_id": tenant,
        "channel": channel,
        "success_rate": success_rate,
        "retry_rate": retry_rate,
        "dlq_depth": dlq_depth,
        "jitter_ms_avg": jitter_ms,
        "proof_ref": bundle_path,
        "meta": _decorate_meta(bundle, events_path, dlq_path, scheduler_path),
      }
    )

  inserted = []
  try:
    inserted = _post_rows(rows)
  except urllib.error.URLError as exc:
    raise SystemExit(f"Failed to write metrics to Supabase: {exc}") from exc

  proof = {
    "phase": "tower_sync",
    "generated_at": now,
    "ingested_rows": len(inserted),
    "sample": inserted[:3],
  }
  proof["sha256"] = _sha(proof)
  OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  OUT_PATH.write_text(json.dumps(proof, indent=2))
  print(f"Ingested {len(inserted)} metrics rows → {OUT_PATH}")


if __name__ == "__main__":
  bundle_arg = sys.argv[1] if len(sys.argv) > 1 else BUNDLE_DEFAULT
  main(bundle_arg)
