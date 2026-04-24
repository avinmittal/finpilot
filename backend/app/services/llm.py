import json
import logging
import re
try:
    from openai import OpenAI, OpenAIError
except ModuleNotFoundError:  # Allows deterministic fallback tests without OpenAI installed.
    OpenAI = None
    OpenAIError = Exception
from app.services.calculators import sip_future_value, loan_vs_invest, compare_tax_regimes
from app.services.prompts import FINPILOT_SYSTEM_PROMPT, build_user_prompt
from app.services.tool_registry import openai_tool_schemas, run_tool

logger = logging.getLogger(__name__)
_OPENAI_TIMEOUT = 30

def _fallback_response(message: str, profile_context: str = "") -> str:
    m = message.lower()

    amount = r"([\d,]+(?:\.\d+)?)"
    pct = r"(\d+(?:\.\d+)?)\s*%"
    years = r"(\d+)\s*-?\s*year"

    def sip_reply(monthly_investment: float, annual_return_pct: float, duration_years: int) -> str:
        result = sip_future_value(monthly_investment, annual_return_pct, duration_years)
        return (
            f"Based on a monthly SIP of ₹{result['monthly_investment']:,.0f} for {result['years']} years at "
            f"{result['annual_return_pct']}%, total invested is about ₹{result['total_invested']:,.0f} and "
            f"future value may be about ₹{result['future_value']:,.0f}. "
            "Use this as an education-first projection, not a guaranteed return."
        )

    sip = re.search(amount + r"\s*(?:per month|/month).*?" + pct + r".*?" + years, m)
    if sip:
        return sip_reply(float(sip.group(1).replace(",", "")), float(sip.group(2)), int(sip.group(3)))

    sip = re.search(amount + r"\s*(?:per month|/month).*?" + years + r".*?" + pct, m)
    if sip:
        return sip_reply(float(sip.group(1).replace(",", "")), float(sip.group(3)), int(sip.group(2)))

    sip = re.search(years + r".*?" + amount + r"\s*(?:per month|/month).*?" + pct, m)
    if sip:
        return sip_reply(float(sip.group(2).replace(",", "")), float(sip.group(3)), int(sip.group(1)))

    sip = re.search(years + r".*?" + pct + r".*?" + amount + r"\s*(?:per month|/month)", m)
    if sip:
        return sip_reply(float(sip.group(3).replace(",", "")), float(sip.group(2)), int(sip.group(1)))

    loan = re.search(r"(\d+(?:\.\d+)?).*?(?:loan).*?(\d+(?:\.\d+)?)\s*%.*?(?:invest).*?(\d+(?:\.\d+)?)\s*%.*?(\d+)\s*year", m)
    if loan:
        result = loan_vs_invest(float(loan.group(1)), float(loan.group(2)), float(loan.group(3)), int(loan.group(4)))
        pref = "investing" if result["difference"] > 0 else "prepaying"
        return (
            f"Over {result['years']} years, {pref} looks better on a pure math basis. "
            f"The difference is about ₹{abs(result['difference']):,.0f}. "
            f"This ignores taxes, liquidity needs, and risk."
        )

    tax = re.search(r"(?:salary|income).*?(\d+(?:\.\d+)?).*?(?:deduction|deductions).*?(\d+(?:\.\d+)?)", m)
    if tax:
        result = compare_tax_regimes(float(tax.group(1)), float(tax.group(2)))
        return (
            f"Estimated old-regime tax: ₹{result['old_regime_tax']:,.0f}. "
            f"Estimated new-regime tax: ₹{result['new_regime_tax']:,.0f}. "
            f"Better regime: {result['better_regime']}."
        )

    return (
        "I can help with SIP projections, loan-vs-invest comparisons, tax-regime comparisons, "
        "portfolio uploads, and profile-aware financial questions."
    )

def generate_financial_response(message: str, profile: dict | None = None) -> str:
    from app.core.config import settings

    profile_context = json.dumps(profile or {}, ensure_ascii=False)
    if not settings.openai_api_key or OpenAI is None:
        return _fallback_response(message, profile_context)

    client = OpenAI(api_key=settings.openai_api_key)
    initial_input = [
        {"role": "system", "content": FINPILOT_SYSTEM_PROMPT},
        {"role": "user", "content": build_user_prompt(message, profile_context)}
    ]

    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=initial_input,
            tools=openai_tool_schemas(),
            timeout=_OPENAI_TIMEOUT,
        )
    except OpenAIError:
        logger.warning("OpenAI call failed, falling back to regex parser", exc_info=True)
        return _fallback_response(message, profile_context)

    tool_outputs = []
    for item in response.output:
        if getattr(item, "type", None) != "function_call":
            continue
        result = run_tool(item.name, item.arguments)
        tool_outputs.append({
            "type": "function_call_output",
            "call_id": item.call_id,
            "output": json.dumps(result)
        })

    if tool_outputs:
        try:
            final_response = client.responses.create(
                model=settings.openai_model,
                input=initial_input + response.output + tool_outputs,
                timeout=_OPENAI_TIMEOUT,
            )
            return final_response.output_text
        except OpenAIError:
            logger.warning("OpenAI tool-call follow-up failed, falling back", exc_info=True)
            return _fallback_response(message, profile_context)

    return response.output_text
