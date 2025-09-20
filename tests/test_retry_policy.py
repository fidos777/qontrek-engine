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


def test_send_meter_http_retry_policy_matches_spec():
    flow = load_flow("send_meter.json")
    http_node = node_by_name(flow, "Send WhatsApp")
    options = http_node["parameters"].get("options", {})
    retry = options.get("retry", {})

    assert retry.get("maxAttempts") == 3
    assert retry.get("waitBetweenAttempts") == 2000
    assert retry.get("waitBetweenAttemptsMax") == 8000
    assert retry.get("waitPolicy") == "exponential"

    codes = retry.get("retryOnHttpResponseCodes") or []
    assert {"429", "500", "502", "503", "504"}.issubset(set(codes))


def test_status_check_marks_retryable_codes():
    status_code = Path("flows/js/status_check.js").read_text()
    assert "statusCode === 429" in status_code
    assert "statusCode >= 500" in status_code
    assert "item.json.retryable" in status_code
