import json
from pathlib import Path

import pytest


def load_flow(filename: str) -> dict:
    path = Path("flows") / filename
    if not path.exists():
        pytest.skip(f"Flow definition {filename} is missing")
    return json.loads(path.read_text())


def node_by_name(flow: dict, name: str) -> dict:
    for node in flow.get("nodes", []):
        if node.get("name") == name:
            return node
    raise AssertionError(f"Node '{name}' not found in flow")


def test_payload_builder_uses_multitenant_idempotency_key():
    code = Path("flows/js/payload_builder.js").read_text()
    assert "createHash('sha1')" in code
    assert "[brand, requestId, templateName, localeSeed, purpose].join('|')" in code
    assert "purpose = data.purpose" in code
    assert "ops_flow: data.ops_flow || 'flow_b_send_meter'" in code

    flow = load_flow("send_meter.json")
    builder_code = node_by_name(flow, "Prepare Send Payload")["parameters"]["functionCode"]
    assert "idempotencySeed = [brand, requestId, templateName, localeSeed, purpose].join('|')" in builder_code
    assert "idempotency_key" in builder_code
    assert "ops_flow: data.ops_flow || 'flow_b_send_meter'" in builder_code


def test_send_meter_inserts_idempotency_key_everywhere():
    flow = load_flow("send_meter.json")
    nodes = {node["name"]: node for node in flow.get("nodes", [])}

    for name in ("Log Template Sent", "Log Template Reversed", "Log Template Held"):
        query = nodes[name]["parameters"]["query"]
        assert "{{$json.idempotency_key}}" in query

    credit_query = nodes["Insert Credit Log"]["parameters"]["query"]
    assert "{{$json.idempotency_key}}" in credit_query

    ops_sql = Path("sql/ops_log_insert.sql").read_text()
    assert "set_config('app.brand'" in ops_sql
    assert "idempotency_key" in ops_sql
    assert "flow" in ops_sql and "node" in ops_sql
    assert "latency_ms" in ops_sql
    assert "error_code" in ops_sql
