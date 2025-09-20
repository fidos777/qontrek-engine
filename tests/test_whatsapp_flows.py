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

    policy_if = flow.get("connections", {}).get("Policy Blocked?", {}).get("main", [])
    assert len(policy_if) == 2
    assert policy_if[0][0]["node"] == "Mark Held"

    held_targets = flow.get("connections", {}).get("Log Template Held", {}).get("main", [])
    assert any(conn["node"] == "Ops Log (Held)" for branch in held_targets for conn in branch)


def test_roi_nudge_cooldown_branch_logs_hold_reason():
    flow = load_flow("roi_nudge.json")
    evaluate_code = node_by_name(flow, "Evaluate Eligibility")["parameters"]["functionCode"]
    assert "cooldown_active" in evaluate_code
    assert "Cooling down" in evaluate_code or "cooldown" in evaluate_code.lower()

    log_query = node_by_name(flow, "Log Held")["parameters"]["query"]
    assert "status" in log_query and "'held'" in log_query
    assert "reversal_reason" in log_query
    assert "{{$json.hold_reason}}" in log_query

    connections = flow.get("connections", {})
    eligible_branches = connections.get("Eligible?", {}).get("main", [])
    assert len(eligible_branches) >= 2, "Eligible? node must split into send vs hold branches"
    assert eligible_branches[1][0]["node"] == "Log Held"


def test_roi_nudge_opt_out_branch_logs_hold_reason():
    flow = load_flow("roi_nudge.json")
    evaluate_code = node_by_name(flow, "Evaluate Eligibility")["parameters"]["functionCode"]
    assert "Opt-out" in evaluate_code
    assert "opt_out_reason" in evaluate_code

    log_query = node_by_name(flow, "Log Held")["parameters"]["query"]
    assert "reversal_reason" in log_query


def test_referral_flow_is_idempotent_and_single_send():
    flow = load_flow("referral.json")
    insert_query = node_by_name(flow, "Insert Referral")["parameters"]["query"]
    assert "ON CONFLICT (brand, installation_id) DO NOTHING" in insert_query

    connections = flow.get("connections", {})
    inserted_branches = connections.get("Inserted?", {}).get("main", [])
    assert len(inserted_branches) == 1, "Referral flow should only send when insert succeeds"
    assert inserted_branches[0][0]["node"] == "Prepare Send Payload"

    send_targets = connections.get("Prepare Send Payload", {}).get("main", [])
    assert any(conn["node"] == "Send Reward" for branch in send_targets for conn in branch)
