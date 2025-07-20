import hashlib
import hmac
import os

SECRET_KEY = os.getenv("WEBHOOK_SECRET", "default_secret")

def validate_nonce(payload: dict) -> bool:
    """Validates the nonce using a hash-based HMAC pattern"""
    received_nonce = payload.get("nonce")
    lead_id = payload.get("lead_id", "")
    agent = payload.get("agent", "")

    message = f"{lead_id}:{agent}"
    expected_nonce = hmac.new(
        SECRET_KEY.encode(),
        msg=message.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    return received_nonce == expected_nonce

# retriever/utils/nonce_checker.py

def is_valid_nonce(nonce):
    # Simple check — you can replace this with a token validator
    return nonce == "voltek123"

