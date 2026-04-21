from app.services.llm import _fallback_response


def test_fallback_handles_duration_first_sip_prompt():
    reply = _fallback_response("Build a 15-year SIP plan for ₹25,000 per month at 12%.")

    assert "monthly SIP of ₹25,000" in reply
    assert "15 years" in reply
    assert "12.0%" in reply
    assert "₹12,614,400" in reply


def test_fallback_handles_amount_first_sip_prompt():
    reply = _fallback_response("Project ₹25,000 per month for 15 years at 12%.")

    assert "monthly SIP of ₹25,000" in reply
    assert "15 years" in reply
    assert "₹12,614,400" in reply
