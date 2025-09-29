#!/usr/bin/env python3
"""Cron-friendly reconciliation script for WhatsApp metering gaps."""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Iterable, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_KEY")
SLACK_WEBHOOK_ENV = "SLACK_WEBHOOK_URL"


@dataclass
class UnmeteredRow:
    brand: str
    idempotency_key: str
    request_id: Optional[str]
    template_name: Optional[str]
    created_at: str


class SupabaseRestClient:
    def __init__(self, base_url: str, service_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_key = service_key

    def _headers(self, profile: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Accept": "application/json",
        }
        if profile and profile != "public":
            headers["Accept-Profile"] = profile
        return headers

    def get(self, path: str, params: Optional[Dict[str, str]] = None, profile: Optional[str] = None) -> List[Dict[str, object]]:
        url = f"{self.base_url}/rest/v1/{path}"
        if params:
            url = f"{url}?{urlencode(params, doseq=True)}"

        request = Request(url, headers=self._headers(profile=profile))
        try:
            with urlopen(request, timeout=15) as response:
                payload = response.read().decode("utf-8")
        except HTTPError as exc:  # type: ignore[attr-defined]
            raise RuntimeError(f"Supabase responded with HTTP {exc.code} for {path}") from exc
        except URLError as exc:
            raise ConnectionError(str(exc)) from exc

        if not payload:
            return []
        data = json.loads(payload)
        return data if isinstance(data, list) else [data]


def load_env() -> Dict[str, str]:
    missing = [key for key in REQUIRED_ENV if not os.getenv(key)]
    if missing:
        raise SystemExit(f"Missing required environment variables: {', '.join(missing)}")
    return {key: os.environ[key] for key in REQUIRED_ENV}


def fetch_unmetered(client: SupabaseRestClient, brand: Optional[str] = None) -> List[UnmeteredRow]:
    params = {
        "select": "brand,idempotency_key,request_id,template_name,created_at",
        "missing_credit": "eq.true",
        "order": "created_at.desc",
    }
    if brand:
        params["brand"] = f"eq.{brand}"

    rows = client.get("vw_unmetered_24h", params=params)
    results: List[UnmeteredRow] = []
    for row in rows:
        results.append(
            UnmeteredRow(
                brand=str(row.get("brand", "")),
                idempotency_key=str(row.get("idempotency_key", "")),
                request_id=row.get("request_id") and str(row.get("request_id")),
                template_name=row.get("template_name") and str(row.get("template_name")),
                created_at=str(row.get("created_at", "")),
            )
        )
    return results


def check_credit_present(client: SupabaseRestClient, row: UnmeteredRow) -> bool:
    params = {
        "select": "id",
        "brand": f"eq.{row.brand}",
        "idempotency_key": f"eq.{row.idempotency_key}",
        "limit": "1",
    }
    records = client.get("credit_logs", params=params)
    return bool(records)


def send_slack_alert(webhook: str, rows: Iterable[UnmeteredRow]) -> None:
    grouped: Dict[str, List[UnmeteredRow]] = {}
    for row in rows:
        grouped.setdefault(row.brand, []).append(row)

    lines = [":rotating_light: WhatsApp metering gaps detected"]
    for brand, items in grouped.items():
        lines.append(f"*{brand}* – {len(items)} pending credit logs")
        for row in items[:5]:
            created = row.created_at or "unknown"
            template = row.template_name or "(unknown template)"
            lines.append(f" • {template} ({row.idempotency_key}) @ {created}")
        if len(items) > 5:
            lines.append(f" • …and {len(items) - 5} more")

    payload = json.dumps({"text": "\n".join(lines)}).encode("utf-8")
    request = Request(webhook, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=10):
            return
    except Exception as exc:  # pragma: no cover - best effort alerting
        print(f"[WARN] Failed to post Slack alert: {exc}", file=sys.stderr)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reconcile WhatsApp metering gaps")
    parser.add_argument("--brand", help="Limit reconciliation to a single brand")
    parser.add_argument(
        "--alert", action="store_true", help="Send Slack alert when unresolved gaps remain"
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    env = load_env()
    client = SupabaseRestClient(env["SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"])

    try:
        unmetered = fetch_unmetered(client, brand=args.brand)
    except Exception as exc:
        print(f"Failed to fetch vw_unmetered_24h: {exc}", file=sys.stderr)
        return 1

    if not unmetered:
        print("✅ No unmetered sends detected in the last 24h")
        return 0

    unresolved: List[UnmeteredRow] = []
    resolved = 0
    for row in unmetered:
        try:
            if check_credit_present(client, row):
                resolved += 1
                continue
        except Exception as exc:
            print(f"[WARN] Credit recheck failed for {row.brand}/{row.idempotency_key}: {exc}")
        unresolved.append(row)

    timestamp = datetime.utcnow().isoformat()
    print(f"[{timestamp}] Reconciled {len(unmetered)} rows → {resolved} already credited, {len(unresolved)} still missing")

    if unresolved and args.alert:
        webhook = os.getenv(SLACK_WEBHOOK_ENV)
        if webhook:
            send_slack_alert(webhook, unresolved)
        else:
            print("[WARN] SLACK_WEBHOOK_URL not configured, skipping alert dispatch")

    return 1 if unresolved else 0


if __name__ == "__main__":
    sys.exit(main())
