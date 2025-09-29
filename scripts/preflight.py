#!/usr/bin/env python3
"""Preflight checks for the Voltek/Qontrek WhatsApp runtime."""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
OPTIONAL_ENV = ["SUPABASE_API_KEY", "SUPABASE_ANON_KEY"]
TABLE_CHECKS = [
    "events_raw",
    "wa_template_log",
    "credit_logs",
    "brand_config",
    "ops_logs",
]
COLUMN_EXPECTATIONS = {
    "events_raw": ["brand", "idempotency_key"],
    "wa_template_log": ["brand", "idempotency_key"],
    "credit_logs": ["brand", "idempotency_key"],
    "brand_config": ["brand", "phone_number_id", "whatsapp_api_token"],
    "ops_logs": ["brand", "flow", "node", "status", "idempotency_key"],
}
UNIQUE_EXPECTATIONS = {
    "wa_template_log": ["brand", "idempotency_key"],
    "credit_logs": ["brand", "idempotency_key"],
}


@dataclass
class HttpResponse:
    status: int
    body: str


class PreflightRunner:
    def __init__(self) -> None:
        self.failures = 0
        self.supabase_url: Optional[str] = None
        self.service_key: Optional[str] = None
        self.rest_url: Optional[str] = None
        self.base_headers: Dict[str, str] = {}
        self.connected = False

    # ------------------------------------------------------------------
    # Messaging helpers
    def ok(self, message: str) -> None:
        print(f"✅ {message}")

    def fail(self, message: str) -> None:
        self.failures += 1
        print(f"❌ {message}")

    def warn(self, message: str) -> None:
        print(f"⚠️  {message}")

    # ------------------------------------------------------------------
    def check_environment(self) -> bool:
        missing: List[str] = []
        for key in REQUIRED_ENV:
            value = os.getenv(key)
            if not value:
                missing.append(key)
            else:
                if key == "SUPABASE_URL":
                    self.supabase_url = value.rstrip("/")
                elif key == "SUPABASE_SERVICE_KEY":
                    self.service_key = value
        if missing:
            self.fail(
                "Missing required environment variables: "
                + ", ".join(missing)
            )
            return False

        for key in OPTIONAL_ENV:
            if os.getenv(key):
                break
        else:
            self.warn(
                "SUPABASE_API_KEY/SUPABASE_ANON_KEY not set. Batch uploads may fail."
            )

        self.rest_url = f"{self.supabase_url}/rest/v1"
        self.base_headers = {
            "apikey": self.service_key or "",
            "Authorization": f"Bearer {self.service_key}",
            "Accept": "application/json",
        }
        self.ok("Environment variables present")
        return True

    # ------------------------------------------------------------------
    def _http_get(self, path: str, params: Optional[Dict[str, str]] = None,
                  profile: Optional[str] = None) -> HttpResponse:
        if not self.rest_url:
            raise RuntimeError("Supabase REST URL not initialised")

        url = f"{self.rest_url}/{path}"
        if params:
            query = urlencode(params, doseq=True)
            url = f"{url}?{query}"

        headers = dict(self.base_headers)
        if profile and profile != "public":
            headers["Accept-Profile"] = profile

        request = Request(url, headers=headers)

        try:
            with urlopen(request, timeout=10) as response:
                body = response.read().decode("utf-8")
                status = response.status
        except HTTPError as exc:  # type: ignore[attr-defined]
            body = exc.read().decode("utf-8", errors="ignore")
            return HttpResponse(status=exc.code, body=body)
        except URLError as exc:
            raise ConnectionError(str(exc)) from exc

        return HttpResponse(status=status, body=body)

    def supabase_get(
        self,
        path: str,
        params: Optional[Dict[str, str]] = None,
        profile: Optional[str] = None,
    ) -> List[Dict[str, object]]:
        response = self._http_get(path, params=params, profile=profile)
        if response.status >= 400:
            raise PreflightError(
                f"Supabase responded with HTTP {response.status} for {path}: {response.body[:200]}"
            )
        body = response.body.strip()
        if not body:
            return []
        try:
            data = json.loads(body)
        except json.JSONDecodeError as exc:
            raise PreflightError(
                f"Failed to decode Supabase response for {path}: {exc}"
            ) from exc
        if isinstance(data, list):
            return data
        return [data]

    # ------------------------------------------------------------------
    def check_connection(self) -> bool:
        try:
            self.supabase_get("brand_config", {"select": "brand", "limit": "1"})
        except PreflightError as exc:
            self.fail(f"Unable to query Supabase REST API: {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Failed to reach Supabase: {exc}")
            return False

        self.connected = True
        self.ok("Supabase connection succeeded")
        return True

    # ------------------------------------------------------------------
    def check_table_exists(self, table: str) -> bool:
        try:
            self.supabase_get(table, {"select": "*", "limit": "1"})
        except PreflightError as exc:
            self.fail(f"Table '{table}' check failed: {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Connection error while checking table '{table}': {exc}")
            return False
        self.ok(f"Table '{table}' accessible")
        return True

    def check_columns(self, table: str, expected: Sequence[str]) -> bool:
        try:
            rows = self.supabase_get(
                "information_schema.columns",
                {
                    "select": "column_name",
                    "table_schema": "eq.public",
                    "table_name": f"eq.{table}",
                },
                profile="postgres",
            )
        except PreflightError as exc:
            self.fail(f"Unable to inspect columns for '{table}': {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Connection error while fetching columns for '{table}': {exc}")
            return False

        available = {row.get("column_name") for row in rows if row.get("column_name")}
        missing = [col for col in expected if col not in available]
        if missing:
            self.fail(
                f"Table '{table}' is missing expected columns: {', '.join(missing)}"
            )
            return False
        self.ok(
            f"Table '{table}' has required columns ({', '.join(expected)})"
        )
        return True

    def check_unique_constraint(self, table: str, columns: Sequence[str]) -> bool:
        try:
            constraints = self.supabase_get(
                "information_schema.table_constraints",
                {
                    "select": "constraint_name",
                    "table_schema": "eq.public",
                    "table_name": f"eq.{table}",
                    "constraint_type": "eq.UNIQUE",
                },
                profile="postgres",
            )
        except PreflightError as exc:
            self.fail(f"Unable to inspect constraints for '{table}': {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Connection error while fetching constraints for '{table}': {exc}")
            return False

        desired = list(columns)
        for constraint in constraints:
            name = constraint.get("constraint_name")
            if not name:
                continue
            try:
                usage = self.supabase_get(
                    "information_schema.key_column_usage",
                    {
                        "select": "column_name,ordinal_position",
                        "table_schema": "eq.public",
                        "table_name": f"eq.{table}",
                        "constraint_name": f"eq.{name}",
                        "order": "ordinal_position.asc",
                    },
                    profile="postgres",
                )
            except PreflightError:
                continue
            ordered = [row.get("column_name") for row in usage if row.get("column_name")]
            if ordered == desired:
                self.ok(
                    f"Unique constraint '{name}' covers {table}({', '.join(desired)})"
                )
                return True

        self.fail(
            f"No UNIQUE constraint found for {table}({', '.join(desired)})"
        )
        return False

    def check_view(self, view_name: str) -> bool:
        try:
            self.supabase_get(view_name, {"select": "*", "limit": "1"})
        except PreflightError as exc:
            self.fail(f"View '{view_name}' check failed: {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Connection error while checking view '{view_name}': {exc}")
            return False
        self.ok(f"View '{view_name}' accessible")
        return True

    def check_brand_config_rows(self) -> bool:
        try:
            rows = self.supabase_get(
                "brand_config",
                {"select": "brand", "limit": "1"},
            )
        except PreflightError as exc:
            self.fail(f"Unable to query brand_config: {exc}")
            return False
        except ConnectionError as exc:
            self.fail(f"Connection error while querying brand_config: {exc}")
            return False

        if not rows:
            self.fail("brand_config table is empty; seed at least one tenant")
            return False
        self.ok("brand_config has at least one tenant configured")
        return True

    # ------------------------------------------------------------------
    def run(self) -> int:
        env_ready = self.check_environment()
        if not env_ready:
            # Without environment variables we cannot proceed further.
            print("\nResolve environment issues above and re-run preflight.")
            return 1

        connection_ok = self.check_connection()
        if connection_ok:
            for table in TABLE_CHECKS:
                self.check_table_exists(table)
                expected = COLUMN_EXPECTATIONS.get(table)
                if expected:
                    self.check_columns(table, expected)
            for table, columns in UNIQUE_EXPECTATIONS.items():
                self.check_unique_constraint(table, columns)
            self.check_view("vw_unmetered_24h")
            self.check_view("ops_alerts")
            self.check_view("vw_templates_by_price")
            self.check_brand_config_rows()

        if self.failures:
            print(
                f"\nPreflight completed with {self.failures} issue(s)."
                " See ❌ outputs above."
            )
            return 1

        print("\nAll preflight checks passed!")
        return 0


class PreflightError(RuntimeError):
    """Raised when Supabase REST responses indicate an error."""


if __name__ == "__main__":
    runner = PreflightRunner()
    sys.exit(runner.run())
