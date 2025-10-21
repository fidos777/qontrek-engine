#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import List, Dict, Any


SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE")


def parse_window(window: str) -> int:
  value = window.strip().lower()
  if value.endswith("h"):
    return int(value[:-1])
  if value.endswith("m"):
    return max(int(value[:-1]) // 60, 1)
  return int(value)


def headers() -> Dict[str, str]:
  if not SUPABASE_URL or not ANON_KEY:
    raise SystemExit("Missing SUPABASE_URL or SUPABASE_ANON_KEY")
  return {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}


def fetch_metrics(limit: int = 1000) -> List[Dict[str, Any]]:
  query = "/rest/v1/metrics_runtime"
  params = {
    "select": "recorded_at,tenant_id,channel,success_rate,retry_rate,dlq_depth,jitter_ms_avg,proof_ref,meta",
    "order": "recorded_at.desc",
    "limit": limit,
  }
  url = f"{SUPABASE_URL}{query}?{urllib.parse.urlencode(params)}"
  req = urllib.request.Request(url, headers=headers())
  try:
    with urllib.request.urlopen(req, timeout=20) as response:
      payload = response.read().decode("utf-8")
      return json.loads(payload) if payload else []
  except urllib.error.URLError as exc:
    raise SystemExit(f"Failed to fetch metrics: {exc}") from exc


def sha(data: Dict[str, Any]) -> str:
  return hashlib.sha256(json.dumps(data, sort_keys=True).encode("utf-8")).hexdigest()


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Fetch recent metrics_runtime rows for autonomy loop.")
  parser.add_argument("--window", default="6h", help="Time window to retain (e.g. 6h, 90m).")
  parser.add_argument(
    "--out",
    default="proof/autonomy/metrics_snapshot.json",
    type=Path,
    help="Output path for metrics snapshot.",
  )
  args = parser.parse_args(argv)

  window_hours = parse_window(args.window)
  cutoff = dt.datetime.utcnow() - dt.timedelta(hours=window_hours)

  rows = fetch_metrics()
  filtered = []
  for row in rows:
    timestamp = row.get("recorded_at")
    if not timestamp:
      continue
    try:
      seen = dt.datetime.fromisoformat(timestamp.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
      continue
    if seen >= cutoff:
      filtered.append(row)

  payload = {
    "phase": "autonomy",
    "generated_at": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "window_hours": window_hours,
    "row_count": len(filtered),
    "records": filtered,
    "cutoff": cutoff.replace(microsecond=0).isoformat() + "Z",
  }
  payload["sha256"] = sha(payload)

  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(payload, indent=2))
  print(f"Fetched {len(filtered)} rows → {args.out}")


if __name__ == "__main__":
  main()
