import json
import os
import re
from openai import OpenAI
from app.core.config import settings
from app.services.calculators import sip_future_value, loan_vs_invest, compare_tax_regimes

SYSTEM_PROMPT = """
You are FinPilot, an educational financial copilot for India.
Rules:
- Be practical and concise.
- Use tools for math.
- Do not provide direct buy/sell security recommendations.
- Use the user's financial profile context if provided.
- When relevant, explain assumptions.
"""

TOOLS = [
    {
        "type": "function",
        "name": "sip_future_value",
        "description": "Calculate future value of a monthly SIP investment.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "monthly_investment": {"type": "number"},
                "annual_return_pct": {"type": "number"},
                "years": {"type": "integer"}
            },
            "required": ["monthly_investment", "annual_return_pct", "years"],
            "additionalProperties": False
        }
    },
    {
        "type": "function",
        "name": "loan_vs_invest",
        "description": "Compare loan prepayment vs investing a lump sum.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "lump_sum": {"type": "number"},
                "loan_rate_pct": {"type": "number"},
                "expected_return_pct": {"type": "number"},
                "years": {"type": "integer"}
            },
            "required": ["lump_sum", "loan_rate_pct", "expected_return_pct", "years"],
            "additionalProperties": False
        }
    },
    {
        "type": "function",
        "name": "compare_tax_regimes",
        "description": "Compare simplified Indian old and new income tax regimes.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "annual_salary": {"type": "number"},
                "deductions_old_regime": {"type": "number"}
            },
            "required": ["annual_salary", "deductions_old_regime"],
            "additionalProperties": False
        }
    }
]

def _run_tool(name: str, args: dict) -> dict:
    if name == "sip_future_value":
        return sip_future_value(**args)
    if name == "loan_vs_invest":
        return loan_vs_invest(**args)
    if name == "compare_tax_regimes":
        return compare_tax_regimes(**args)
    raise ValueError(f"Unknown tool: {name}")

def _fallback_response(message: str, profile_context: str = "") -> str:
    m = message.lower()

    sip = re.search(r"(\d+(?:\.\d+)?)\s*(?:per month|/month).*?(\d+(?:\.\d+)?)\s*%.*?(\d+)\s*year", m)
    if sip:
        result = sip_future_value(float(sip.group(1)), float(sip.group(2)), int(sip.group(3)))
        return (
            f"Based on a monthly SIP of ₹{result['monthly_investment']:,.0f} for {result['years']} years at "
            f"{result['annual_return_pct']}%, total invested is about ₹{result['total_invested']:,.0f} and "
            f"future value may be about ₹{result['future_value']:,.0f}."
        )

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
    profile_context = json.dumps(profile or {}, ensure_ascii=False)
    if not settings.openai_api_key:
        return _fallback_response(message, profile_context)

    client = OpenAI(api_key=settings.openai_api_key)
    initial_input = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"User profile context: {profile_context}\n\nUser message: {message}"}
    ]

    response = client.responses.create(
        model=settings.openai_model,
        input=initial_input,
        tools=TOOLS,
    )

    tool_outputs = []
    for item in response.output:
        if getattr(item, "type", None) != "function_call":
            continue
        args = json.loads(item.arguments)
        result = _run_tool(item.name, args)
        tool_outputs.append({
            "type": "function_call_output",
            "call_id": item.call_id,
            "output": json.dumps(result)
        })

    if tool_outputs:
        final_response = client.responses.create(
            model=settings.openai_model,
            input=initial_input + response.output + tool_outputs,
        )
        return final_response.output_text

    return response.output_text
