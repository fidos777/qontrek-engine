import pytest
from agent_runner import template_guard, gpt_qualifier_score

def test_template_guard_valid():
    block = {
        "body": "Your solar proposal is ready.",
        "category": "TRANSACTIONAL",
        "header_type": "text"
    }
    assert template_guard(block) is True  # <-- update this line

def test_template_guard_too_long():
    block = {
        "body": "x" * 2000,  # exceed 1024
        "category": "TRANSACTIONAL",
        "header_type": "text"
    }
    with pytest.raises(ValueError):
        template_guard(block)

def test_template_guard_missing_image_url():
    block = {
        "body": "Check this image",
        "category": "MARKETING",
        "header_type": "image"
        # missing image_url!
    }
    with pytest.raises(ValueError):
        template_guard(block)

def test_gpt_qualifier_score_mock(monkeypatch):
    def mock_post(url, json, timeout=None):
        class MockResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"intent_score": 87}

        return MockResponse()

    monkeypatch.setattr("agent_runner.requests.post", mock_post)
    lead_input = {"lead_id": "L123", "text": "Saya nak pasang solar"}
    score = gpt_qualifier_score(lead_input)
    assert score == 87

