from pathlib import Path


def test_locale_resolution_has_fallback_and_hold_reason():
    code = Path("flows/js/resolve_locale.js").read_text()
    assert "'template_locale_missing'" in code
    assert "'en_US'" in code
    assert "policy_hold" in code


def test_phone_validation_marks_invalid_numbers():
    code = Path("flows/js/phone_check.js").read_text()
    assert "^\\+[1-9]\\d{7,14}$" in code
    assert "invalid_phone" in code

    sql_fn = Path("migrations/004_phone_validator_fn.sql").read_text()
    assert "is_e164" in sql_fn
    assert "^\\+[1-9][0-9]{7,14}$" in sql_fn
