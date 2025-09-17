# agent_runner.py
# Voltek runtime: Supabase logging + idempotency upsert + flow executors
# SAFE BY DEFAULT: DRY_RUN=1 (no real sends). Switch to live later.

from __future__ import annotations
import os
import uuid
try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - lightweight stub for tests
    class _RequestsStub:
        get = post = patch = delete = None

        def __getattr__(self, name):
            raise ModuleNotFoundError("requests module is required for network calls")

    requests = _RequestsStub()  # type: ignore
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Tuple, Optional

# =========================
# Environment configuration
# =========================
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
SLACK_WEBHOOK: str = os.getenv("SLACK_WEBHOOK_URL", "")  # optional
# Safety switch: keep DRY_RUN=1 while WhatChimp not configured
DRY_RUN: bool = os.getenv("DRY_RUN", "1") == "1"

# (for later) WhatChimp creds — optional until you go live
WHATCHIMP_API_URL: str = os.getenv("WHATCHIMP_API_URL", "").rstrip("/")
WHATCHIMP_KEY: str = os.getenv("WHATCHIMP_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARN] SUPABASE_URL / SUPABASE_SERVICE_KEY not set. Supabase calls may fail.")
if DRY_RUN:
    print("[INFO] DRY_RUN=1 → no real WhatsApp sends. Safe mode.")

# ============
# HTTP helpers
# ============
def _sb_headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "count=exact",
    }
    if extra:
        h.update(extra)
    return h

def _sb_select(path: str, params: Dict[str, Any]):
    # Range header ensures PostgREST returns Content-Range for counts
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_sb_headers() | {"Range": "0-0"},
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    return r

def _sb_update(table: str, match_params: Dict[str, str], payload: Dict[str, Any]):
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers({"Prefer": "return=minimal"}),
        params=match_params,
        json=payload,
        timeout=15,
    )
    r.raise_for_status()
    return True

def _sb_upsert_on_conflict(table: str, payload: dict, conflict_col: str):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers({"Prefer": "resolution=merge-duplicates,return=representation"}),
        params={"on_conflict": conflict_col},
        json=payload,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()

def _count_from_content_range(resp) -> int:
    cr = resp.headers.get("Content-Range", "")
    return int(cr.split("/")[-1]) if "/" in cr else 0

# ===========
# QA utilities
# ===========
def template_guard(block: Dict[str, Any]) -> bool:
    text = block.get("body", "") or ""
    if len(text) > 1024:
        raise ValueError("Template body too long (>1024 chars)")
    if block.get("header_type") == "image" and not block.get("image_url"):
        raise ValueError("Missing image_url for image header")
    return True

def gpt_qualifier_score(lead_input: Dict[str, Any]) -> int:
    url = "https://mocked-url/score"  # replace when you’re ready
    try:
        res = requests.post(url, json=lead_input, timeout=15)
        res.raise_for_status()
        return int(res.json().get("intent_score", 0))
    except Exception:
        return 0

# ======================
# Idempotency + logging
# ======================
def idem_key(lead_id: str, stage: str, flow: str, iso_week: Optional[int] = None) -> str:
    iso_week = iso_week or int(datetime.now().strftime("%G%V"))
    return f"{lead_id}:{stage}:{iso_week}:{flow}"

def log_trigger(
    lead_id: str,
    flow_name: str,
    status: str,
    idempotency_key: str,
    reason: Optional[str] = None,
    error: Optional[str] = None,
    triggered_by: str = "runner",
) -> None:
    payload = {
        "lead_id": lead_id,
        "flow_name": flow_name,
        "triggered_by": triggered_by,
        "trigger_time": datetime.utcnow().isoformat(),
        "idempotency_key": idempotency_key,
        "status": status,
    }
    if reason is not None:
        payload["reason"] = reason
    if error is not None:
        payload["error"] = error
    try:
        _sb_upsert_on_conflict("yaml_trigger_log", payload, "idempotency_key")
    except Exception as e:
        print(f"[WARN] log_trigger upsert failed: {e}")

def should_fire(lead: Dict[str, Any], flow_name: str, guards: Dict[str, Any]) -> Tuple[bool, str, str]:
    key = guards.get("idempotency_key") or idem_key(lead["id"], lead.get("stage", ""), flow_name)

    try:
        r = _sb_select("yaml_trigger_log", {"select": "id", "idempotency_key": "eq." + key})
        if _count_from_content_range(r) > 0:
            return (False, "idempotent_key_exists", key)
    except Exception as e:
        print(f"[WARN] should_fire key check failed: {e}")

    n_days = int(guards.get("not_fired_in_days", 0) or 0)
    if n_days > 0:
        since = (datetime.utcnow() - timedelta(days=n_days)).isoformat()
        try:
            r = _sb_select(
                "yaml_trigger_log",
                {"select": "id", "lead_id": "eq." + lead["id"], "flow_name": "eq." + flow_name, "trigger_time": "gte." + since},
            )
            if _count_from_content_range(r) > 0:
                return (False, "fired_in_window", key)
        except Exception as e:
            print(f"[WARN] should_fire window check failed: {e}")

    max_total = int(guards.get("max_sends_total", 0) or 0)
    if max_total > 0:
        try:
            r = _sb_select("yaml_trigger_log", {"select": "id", "lead_id": "eq." + lead["id"], "flow_name": "eq." + flow_name})
            if _count_from_content_range(r) >= max_total:
                return (False, "max_total_reached", key)
        except Exception as e:
            print(f("[WARN] should_fire max_total check failed: {e}"))

    if guards.get("stop_if_true", False):
        return (False, "stop_if", key)

    return (True, "ok", key)

# ============================
# Send/notify/schedule (safe)
# ============================
def send_whatsapp(to: str, template_id: str, variables: Optional[Dict[str, Any]] = None, quick_replies: Optional[list[str]] = None) -> None:
    """
    SAFE by default:
      - If DRY_RUN=1 or WhatChimp creds missing → print only.
      - When ready: set DRY_RUN=0 and provide WHATCHIMP_API_URL/WHATCHIMP_KEY.
    """
    if DRY_RUN or not (WHATCHIMP_API_URL and WHATCHIMP_KEY):
        print(f"[WA/DRY] to={to} template={template_id} vars={variables} qr={quick_replies}")
        return

    url = f"{WHATCHIMP_API_URL}/send-template"
    headers = {"Authorization": f"Bearer {WHATCHIMP_KEY}", "Content-Type": "application/json"}
    payload = {"to": to, "template_id": template_id, "variables": variables or {}, "quick_replies": quick_replies or []}
    r = requests.post(url, json=payload, headers=headers, timeout=20)
    r.raise_for_status()

def notify_slack(channel: str, text: str) -> None:
    if SLACK_WEBHOOK and not DRY_RUN:
        try:
            requests.post(SLACK_WEBHOOK, json={"text": f"{channel} {text}"}, timeout=10)
        except Exception as e:
            print(f"[WARN] Slack notify failed: {e}")
    else:
        print(f"[SLACK{'/DRY' if DRY_RUN else ''}] {channel}: {text}")

def schedule_flow(flow_name: str, lead_id: str, run_at_iso: str, only_if: Optional[str] = None) -> None:
    # Replace with your real scheduler when ready
    print(f"[SCHEDULE] {flow_name} for {lead_id} at {run_at_iso} only_if={only_if}")

def update_lead(where_id: str, **fields) -> None:
    try:
        _sb_update("lead_log", {"id": "eq." + where_id}, fields)
    except Exception as e:
        print(f"[WARN] update_lead failed: {e}")

# ==========
# Flow body
# ==========
def create_secure_link(lead_id: str, ttl_hours: int = 72) -> str:
    token = uuid.uuid4()
    return f"https://secure.voltek.my/formb/{token}?ttl={ttl_hours}"

def exec_survey_pending_alert(lead: Dict[str, Any], idem: str) -> None:
    send_whatsapp(
        to=lead.get("wa_number", ""),
        template_id="survey_nudge_v1",
        variables={"name": lead.get("first_name", ""), "choice_cta": "Pilih slot survey"},
        quick_replies=["Pilih Slot", "Tunda 1 Minggu", "Saya Perlukan Bantuan"],
    )
    notify_slack(
        "#ops-leads",
        f"🔔 7d post-deposit, tiada survey — {lead.get('id')} ({lead.get('name','')}) • RM{lead.get('estimated_bill','-')} • idle={lead.get('idle_days','?')}d",
    )
    run_at = (datetime.utcnow() + timedelta(days=3)).isoformat()
    schedule_flow("survey_pending_alert_followup", lead.get("id", ""), run_at, only_if="survey_scheduled==false")

def exec_formb_helper(lead: Dict[str, Any], idem: str) -> None:
    formb_link = create_secure_link(lead.get("id", ""), ttl_hours=72)
    send_whatsapp(
        to=lead.get("wa_number", ""),
        template_id="formb_helper_v2",
        variables={"name": lead.get("first_name", ""), "formb_link": formb_link, "video_url": "https://cdn.voltek.my/formb-1min.mp4"},
    )
    run_24h = (datetime.utcnow() + timedelta(hours=24)).isoformat()
    schedule_flow("docs_microcommit_day2", lead.get("id", ""), run_24h, only_if="formb_uploaded==false")
    run_48h = (datetime.utcnow() + timedelta(hours=48)).isoformat()
    schedule_flow("docs_microcommit_day3", lead.get("id", ""), run_48h, only_if="formb_uploaded==false")

# =========================
# Flow wrapper + guardsets
# =========================
ExecFn = Callable[[Dict[str, Any], str], None]

def run_flow(flow_name: str, lead: Dict[str, Any], guards: Dict[str, Any], exec_fn: ExecFn) -> Tuple[str, Optional[str]]:
    allowed, reason, idem = should_fire(lead, flow_name, guards)
    if not allowed:
        log_trigger(lead["id"], flow_name, "skipped", idem, reason=reason)
        return "skipped", reason
    log_trigger(lead["id"], flow_name, "queued", idem)
    try:
        exec_fn(lead, idem)
        log_trigger(lead["id"], flow_name, "sent", idem)
        return "sent", None
    except Exception as e:
        log_trigger(lead["id"], flow_name, "error", idem, error=str(e))
        return "error", str(e)

def guards_survey_pending_alert(lead: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "idempotency_key": idem_key(lead["id"], lead.get("stage", ""), "survey_pending_alert"),
        "not_fired_in_days": 7,
        "max_sends_total": 3,
    }

def guards_formb_helper(lead: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "idempotency_key": idem_key(lead["id"], lead.get("stage", ""), "formb_helper"),
        "not_fired_in_days": 3,
        "max_sends_total": 2,
    }

# =================
# Example triggers
# =================
def maybe_fire_survey_pending_alert(lead: Dict[str, Any]):
    if (
        lead.get("stage") == "Deposit"
        and not lead.get("survey_scheduled", False)
        and float(lead.get("idle_days", 0)) >= 7.0
        and not lead.get("do_not_proceed", False)
        and not lead.get("do_not_contact", False)
    ):
        return run_flow("survey_pending_alert", lead, guards_survey_pending_alert(lead), exec_survey_pending_alert)
    return "skipped", "when_not_matched"

def maybe_fire_formb_helper(lead: Dict[str, Any]):
    quote_sent = bool(lead.get("quote_sent"))
    hours_since_quote = float(lead.get("hours_since_quote", 0))
    if (
        quote_sent
        and not lead.get("formb_uploaded", False)
        and hours_since_quote >= 24
        and not lead.get("do_not_proceed", False)
        and not lead.get("do_not_contact", False)
    ):
        return run_flow("formb_helper", lead, guards_formb_helper(lead), exec_formb_helper)
    return "skipped", "when_not_matched"

# ===========
# Demo / CLI
# ===========
if __name__ == "__main__":
    demo_lead = {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Ali",
        "first_name": "Ali",
        "wa_number": "60123456789",
        "stage": "Deposit",
        "survey_scheduled": False,
        "idle_days": 8.0,
        "do_not_proceed": False,
        "do_not_contact": False,
        "quote_sent": True,
        "hours_since_quote": 30,
        "formb_uploaded": False,
    }
    print(">> Fire survey_pending_alert:")
    print(maybe_fire_survey_pending_alert(demo_lead))
    print(">> Fire survey_pending_alert again (should skip):")
    print(maybe_fire_survey_pending_alert(demo_lead))
    print(">> Fire formb_helper:")
    print(maybe_fire_formb_helper(demo_lead))

