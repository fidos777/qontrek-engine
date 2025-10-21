#!/usr/bin/env python3
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

import requests


WHATCHIMP_ENDPOINT = "https://app.whatchimp.com/api/v1/whatsapp/send/template"
EVENT_LOG_PATH = Path("proof/notify_events.json")


def load_proof(path: Path) -> Dict[str, Any]:
  if not path.exists():
    raise SystemExit(f"Proof not found: {path}")
  return json.loads(path.read_text())


def ensure_env(var: str) -> str:
  value = os.getenv(var)
  if not value:
    raise SystemExit(f"Missing required environment variable: {var}")
  return value


def send_whatsapp_template(payload: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
  if dry_run:
    return {"status": "DRY_RUN", "code": 200, "response": "dry-run"}

  response = requests.post(WHATCHIMP_ENDPOINT, data=payload, timeout=15)
  return {
    "status": "SENT" if response.status_code == 200 else "FAILED",
    "code": response.status_code,
    "response": response.text,
  }


def append_event_log(entry: Dict[str, Any]) -> None:
  if EVENT_LOG_PATH.exists():
    try:
      doc = json.loads(EVENT_LOG_PATH.read_text())
    except json.JSONDecodeError:
      doc = {"events": []}
  else:
    EVENT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc = {"events": []}

  doc.setdefault("events", []).append(entry)
  EVENT_LOG_PATH.write_text(json.dumps(doc, indent=2))


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Send governance alerts via WhatsApp template.")
  parser.add_argument(
    "--scan",
    default="proof/autonomy/corrective_action.json",
    type=Path,
    help="Corrective action proof to scan.",
  )
  parser.add_argument("--dry-run", action="store_true", help="Skip actual API call.")
  args = parser.parse_args(argv)

  proof = load_proof(args.scan)
  decision = proof.get("decision", {})
  severity = decision.get("severity", 0)
  action = decision.get("action", "noop")

  api_token = ensure_env("WHATCHIMP_API_TOKEN")
  phone_id = ensure_env("WHATCHIMP_PHONE_ID")
  template_id = ensure_env("WHATCHIMP_TEMPLATE_ID")

  template_payload = {
    "apiToken": api_token,
    "phone_number_id": phone_id,
    "template_id": template_id,
    "templateVariable-system-cart-product-list-2": f"Drift severity: {severity}",
    "templateVariable-system-cart-total-price-3": f"Action: {action}",
    "templateVariable-system-shipping-address-4": "TowerOps Autonomy",
    "templateVariable-system-delivery-date-5": proof.get("generated_at", "unknown"),
  }

  result = send_whatsapp_template(template_payload, dry_run=args.dry_run)
  event_entry = {
    "generated_at": proof.get("generated_at"),
    "channel": "whatsapp",
    "severity": severity,
    "action": action,
    "dry_run": args.dry_run,
    "result": result,
  }
  append_event_log(event_entry)

  print(f"WhatsApp alert result: {result['status']} (code={result['code']})")


if __name__ == "__main__":
  try:
    main()
  except SystemExit as exc:
    if exc.code != 0:
      print(f"tower_notify_gateway failed: {exc}", file=sys.stderr)
    raise
