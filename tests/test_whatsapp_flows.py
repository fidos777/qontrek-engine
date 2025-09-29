import json
from pathlib import Path

import pytest


FLOWS_DIR = Path("flows")


def load_flow(filename: str) -> dict:
    path = FLOWS_DIR / filename
    if not path.exists():
        pytest.skip(f"Flow definition {filename} is missing")
    return json.loads(path.read_text())


def node_by_name(flow: dict, name: str) -> dict:
    for node in flow.get("nodes", []):
        if node.get("name") == name:
            return node
    raise AssertionError(f"Node '{name}' not found in flow")


def test_inlet_upsert_is_idempotent():
    flow = load_flow("inlet.json")
    upsert_node = node_by_name(flow, "Upsert events_raw")
    query = upsert_node["parameters"]["query"]

    assert "INSERT INTO public.events_raw" in query
    assert "ON CONFLICT (idempotency_key) DO UPDATE" in query
    assert "RETURNING id, idempotency_key" in query


def test_send_meter_failure_records_reversal_without_credit():
    flow = load_flow("send_meter.json")
    nodes = {node["name"]: node for node in flow.get("nodes", [])}

    reversed_query = nodes["Log Template Reversed"]["parameters"]["query"]
    assert "status" in reversed_query and "'reversed'" in reversed_query
    assert "reversal_reason" in reversed_query
    assert "set_config('app.brand'" in reversed_query
    assert "ON CONFLICT (brand, idempotency_key) DO UPDATE" in reversed_query

    connections = flow.get("connections", {})
    status_branches = connections.get("Send Successful?", {}).get("main", [])
    assert len(status_branches) >= 2, "Send Successful? node should have success and failure branches"
    failure_branch = status_branches[1]
    assert failure_branch[0]["node"] == "Log Template Reversed"

    log_sent_targets = connections.get("Log Template Sent", {}).get("main", [])
    assert any(conn["node"] == "Insert Credit Log" for branch in log_sent_targets for conn in branch)

    reversed_targets = connections.get("Log Template Reversed", {}).get("main", [])
    assert not any(conn["node"] == "Insert Credit Log" for branch in reversed_targets for conn in branch)

    ops_log_query = nodes["Ops Log (Reversed)"]["parameters"]["query"]
    assert "{{$loadFile('sql/ops_log_insert.sql')}}" in ops_log_query


def test_send_meter_policy_holds_do_not_send():
    flow = load_flow("send_meter.json")
    nodes = {node["name"]: node for node in flow.get("nodes", [])}

    held_query = nodes["Log Template Held"]["parameters"]["query"]
    assert "'held'" in held_query
    assert "policy_hold_reason" in held_query
    assert "set_config('app.brand'" in held_query

    mark_code = nodes["Mark Held"]["parameters"]["functionCode"]
    assert "ops_node = 'policy_hold'" in mark_code
    assert "ops_error_code" in mark_code

    policy_if = flow.get("connections", {}).get("Policy Blocked?", {}).get("main", [])
    assert len(policy_if) == 2
    assert policy_if[0][0]["node"] == "Mark Held"

    held_targets = flow.get("connections", {}).get("Log Template Held", {}).get("main", [])
    assert any(conn["node"] == "Ops Log (Held)" for branch in held_targets for conn in branch)


def test_roi_nudge_cooldown_branch_logs_hold_reason():
    flow = load_flow("roi_nudge.json")

    check_query = node_by_name(flow, "Check Opt-Outs + Cooldown")["parameters"]["query"]
    assert "interval '72 hours'" in check_query

    evaluate_code = node_by_name(flow, "Evaluate Eligibility")["parameters"]["functionCode"]
    assert "hold_reason" in evaluate_code
    assert "'cooldown'" in evaluate_code
    assert "'roi_nudge_v1'" in evaluate_code

    log_query = node_by_name(flow, "Log Held")["parameters"]["query"]
    assert "status" in log_query and "'held'" in log_query
    assert "{{$json.hold_reason}}" in log_query

    eligible_connections = flow.get("connections", {}).get("Eligible?", {}).get("main", [])
    assert eligible_connections[1][0]["node"] == "Log Held"


def test_roi_nudge_opt_out_branch_detects_keywords():
    flow = load_flow("roi_nudge.json")
    evaluate_code = node_by_name(flow, "Evaluate Eligibility")["parameters"]["functionCode"]

    for keyword in ["STOP", "BATAL", "UNSUBSCRIBE", "BERHENTI"]:
        assert keyword in evaluate_code

    assert "'optout'" in evaluate_code
    assert "keywordOptOut" in evaluate_code


def test_monitor_flow_alerts_on_unmetered_and_acceptance_mismatch():
    flow = load_flow("monitor.json")
    nodes = {node["name"]: node for node in flow.get("nodes", [])}

    unmetered_query = nodes["Fetch Unmetered Count"]["parameters"]["query"]
    assert "vw_unmetered_24h" in unmetered_query
    assert "missing_credit" in unmetered_query

    acceptance_query = nodes["Fetch Acceptance Window"]["parameters"]["query"]
    assert "events_raw" in acceptance_query
    assert "wa_template_log" in acceptance_query
    assert "acceptance_match" in acceptance_query

    acceptance_if = flow.get("connections", {}).get("Acceptance Mismatch?", {}).get("main", [])
    assert acceptance_if and acceptance_if[0][0]["node"] == "Slack Acceptance Alert"


def test_referral_flow_is_idempotent_and_caps_rewards():
    flow = load_flow("referral.json")
    nodes = {node["name"]: node for node in flow.get("nodes", [])}

    cap_query = nodes["Check Reward Cap"]["parameters"]["query"]
    assert "reward_cap_month" in cap_query or "brand_config" in cap_query
    assert "referrer_id" in cap_query

    eval_code = nodes["Evaluate Reward Eligibility"]["parameters"]["functionCode"]
    assert "referrer_id" in eval_code
    assert "'reward_cap'" in eval_code

    insert_query = nodes["Insert Referral"]["parameters"]["query"]
    assert "ON CONFLICT (brand, referrer_id, referred_id, event_name) DO NOTHING" in insert_query
    assert "set_config('app.brand'" in insert_query

    hold_query = nodes["Log Reward Cap Hold"]["parameters"]["query"]
    assert "'reward_cap'" in hold_query
    assert "set_config('app.brand'" in hold_query

    eligible_connections = flow.get("connections", {}).get("Eligible?", {}).get("main", [])
    assert len(eligible_connections) == 2
    assert eligible_connections[1][0]["node"] == "Log Reward Cap Hold"

    inserted_connections = flow.get("connections", {}).get("Inserted?", {}).get("main", [])
    assert inserted_connections[0][0]["node"] == "Prepare Send Payload"

    send_targets = flow.get("connections", {}).get("Prepare Send Payload", {}).get("main", [])
    assert any(conn["node"] == "Send Reward" for branch in send_targets for conn in branch)
