#!/usr/bin/env python3
import datetime as dt
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import List


OUT_PATH = Path("proof/tower_sync_validation.json")
SUMMARY_PATH = Path("proof/tower_sync_summary.json")
THRESHOLD_FILE = Path("config/verify_thresholds.json")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE")

DEFAULT_THRESHOLDS = {
  "ack_rate_min": 0.8,
  "latency_p95_max_ms": 3_600_000,
  "dlq_age_max_h": 24,
  "replay_success_min": 0.95,
  "replay_batch_max": 5_000,
  "replay_time_ms_p95": 300_000,
  "ntp_offset_warn_ms": 1000,
}


def load_thresholds() -> dict:
  if not THRESHOLD_FILE.exists():
    return DEFAULT_THRESHOLDS
  try:
    loaded = json.loads(THRESHOLD_FILE.read_text())
    return {**DEFAULT_THRESHOLDS, **loaded}
  except json.JSONDecodeError:
    return DEFAULT_THRESHOLDS


THRESHOLDS = load_thresholds()


def fail(message: str) -> None:
  print(f"❌ {message}")
  sys.exit(1)


def warn(message: str) -> None:
  print(f"⚠️ {message}")


def _headers() -> dict:
  if not ANON_KEY or not SUPABASE_URL:
    raise SystemExit("Missing SUPABASE_URL or SUPABASE_ANON_KEY env var")
  return {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
  }


def _request(url: str, *, head: bool = False) -> tuple[int, List[dict]]:
  method = "HEAD" if head else "GET"
  req = urllib.request.Request(url, headers=_headers(), method=method)
  try:
    with urllib.request.urlopen(req, timeout=15) as response:
      status = response.status
      if head:
        return status, []
      payload = response.read().decode("utf-8")
      return status, json.loads(payload) if payload else []
  except urllib.error.URLError as exc:
    raise SystemExit(f"Failed to query Supabase: {exc}") from exc


def _sha(obj: dict) -> str:
  snapshot = {key: value for key, value in obj.items() if key != "sha256"}
  return hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode("utf-8")).hexdigest()


def _validate_per_channel(kpis: dict) -> None:
  channels = [
    ("slack", "ack_rate_24h_slack", "latency_p95_ms_slack"),
    ("whatsapp", "ack_rate_24h_wa", "latency_p95_ms_wa"),
    ("email", "ack_rate_24h_email", "latency_p95_ms_email"),
  ]
  for channel, ack_key, latency_key in channels:
    ack_value = kpis.get(ack_key)
    latency_value = kpis.get(latency_key)
    if ack_value is None:
      fail(f"Missing KPI {ack_key}")
    if latency_value is None:
      fail(f"Missing KPI {latency_key}")
    if ack_value < THRESHOLDS["ack_rate_min"]:
      fail(f"{channel} ack_rate {ack_value} < {THRESHOLDS['ack_rate_min']}")
    if latency_value > THRESHOLDS["latency_p95_max_ms"]:
      fail(
        f"{channel} latency p95 {latency_value}ms > "
        f"{THRESHOLDS['latency_p95_max_ms']}ms"
      )


def main(expect_status: int = 200) -> int:
  head_status, _ = _request(f"{SUPABASE_URL}/rest/v1/metrics_runtime?select=count", head=True)
  _, sample = _request(
    f"{SUPABASE_URL}/rest/v1/metrics_runtime?select=tenant_id,channel&limit=1"
  )

  if not SUMMARY_PATH.exists():
    raise SystemExit("Missing proof/tower_sync_summary.json")
  summary = json.loads(SUMMARY_PATH.read_text())
  recomputed = _sha(summary)
  seal_ok = recomputed == summary.get("sha256")

  kpis = summary.get("kpis", {})

  if summary.get("phase") != "tower_sync":
    fail("Summary proof phase mismatch")

  if kpis.get("ack_rate_24h", 0) < THRESHOLDS["ack_rate_min"]:
    fail(f"ack_rate_24h {kpis.get('ack_rate_24h')} < {THRESHOLDS['ack_rate_min']}")

  if kpis.get("alert_action_latency_ms_p95", 0) > THRESHOLDS["latency_p95_max_ms"]:
    fail(
      f"latency p95 {kpis.get('alert_action_latency_ms_p95')}ms > "
      f"{THRESHOLDS['latency_p95_max_ms']}ms"
    )

  if kpis.get("dlq_age_max_h", 0) > THRESHOLDS["dlq_age_max_h"]:
    fail(
      f"DLQ age max {kpis.get('dlq_age_max_h')}h > "
      f"{THRESHOLDS['dlq_age_max_h']}h"
    )

  if kpis.get("replay_success_rate", 0) < THRESHOLDS["replay_success_min"]:
    fail(
      f"replay_success_rate {kpis.get('replay_success_rate')} < "
      f"{THRESHOLDS['replay_success_min']}"
    )

  if kpis.get("replay_batch_max", 0) > THRESHOLDS["replay_batch_max"]:
    fail(
      f"replay_batch_max {kpis.get('replay_batch_max')} > "
      f"{THRESHOLDS['replay_batch_max']}"
    )

  if kpis.get("replay_time_ms_p95", 0) > THRESHOLDS["replay_time_ms_p95"]:
    fail(
      f"replay_time_ms_p95 {kpis.get('replay_time_ms_p95')}ms > "
      f"{THRESHOLDS['replay_time_ms_p95']}ms"
    )

  _validate_per_channel(kpis)

  ntp_offset = abs(kpis.get("ntp_offset_ms", 0))
  if ntp_offset > THRESHOLDS["ntp_offset_warn_ms"]:
    warn(
      f"NTP offset {kpis.get('ntp_offset_ms')}ms exceeds "
      f"±{THRESHOLDS['ntp_offset_warn_ms']}ms"
    )

  if kpis.get("policy_diff_class") == "material":
    fail("Policy diff class = material → human review required")
  if not kpis.get("last_change_receipt_id"):
    warn("Missing last_change_receipt_id in summary")
  if not kpis.get("autotune_guard_active", False):
    warn("Autotune guard inactive")

  generated_at = summary.get("generated_at") or dt.datetime.utcnow().replace(
    microsecond=0
  ).isoformat() + "Z"

  proof = {
    "phase": "tower_sync",
    "generated_at": generated_at,
    "http_ok": head_status == expect_status,
    "has_rows": bool(sample),
    "summary_seal_ok": seal_ok,
    "expected_http": expect_status,
    "kpis": kpis,
    "warnings": ntp_offset > THRESHOLDS["ntp_offset_warn_ms"],
  }
  proof["sha256"] = _sha(proof)
  OUT_PATH.write_text(json.dumps(proof, indent=2))
  print("✅ Tower sync verification passed (v18.1 Reflex Audit Mode)")
  return 0


if __name__ == "__main__":
  status_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 200
  sys.exit(main(status_arg))
