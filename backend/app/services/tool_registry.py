import json
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.services.calculators import loan_vs_invest, sip_future_value
from app.services.tax_calculator import compare_tax_regimes


ToolHandler = Callable[..., dict[str, Any]]


@dataclass(frozen=True)
class FinancialTool:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: ToolHandler

    def openai_schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "name": self.name,
            "description": self.description,
            "strict": True,
            "parameters": self.parameters,
        }


def _object_schema(properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": properties,
        "required": required,
        "additionalProperties": False,
    }


FINANCIAL_TOOLS: dict[str, FinancialTool] = {
    "sip_future_value": FinancialTool(
        name="sip_future_value",
        description="Calculate deterministic future value of a monthly SIP investment.",
        parameters=_object_schema(
            {
                "monthly_investment": {"type": "number"},
                "annual_return_pct": {"type": "number"},
                "years": {"type": "integer"},
            },
            ["monthly_investment", "annual_return_pct", "years"],
        ),
        handler=sip_future_value,
    ),
    "loan_vs_invest": FinancialTool(
        name="loan_vs_invest",
        description="Compare prepaying a loan with investing a lump sum.",
        parameters=_object_schema(
            {
                "lump_sum": {"type": "number"},
                "loan_rate_pct": {"type": "number"},
                "expected_return_pct": {"type": "number"},
                "years": {"type": "integer"},
            },
            ["lump_sum", "loan_rate_pct", "expected_return_pct", "years"],
        ),
        handler=loan_vs_invest,
    ),
    "compare_tax_regimes": FinancialTool(
        name="compare_tax_regimes",
        description="Compare simplified Indian old and new income tax regimes.",
        parameters=_object_schema(
            {
                "annual_salary": {"type": "number"},
                "deductions_old_regime": {"type": "number"},
            },
            ["annual_salary", "deductions_old_regime"],
        ),
        handler=compare_tax_regimes,
    ),
}


def openai_tool_schemas() -> list[dict[str, Any]]:
    return [tool.openai_schema() for tool in FINANCIAL_TOOLS.values()]


def run_tool(name: str, arguments: str | dict[str, Any]) -> dict[str, Any]:
    tool = FINANCIAL_TOOLS.get(name)
    if tool is None:
        raise ValueError(f"Unknown financial tool: {name}")

    parsed_args = json.loads(arguments) if isinstance(arguments, str) else arguments
    if not isinstance(parsed_args, dict):
        raise ValueError(f"Invalid arguments for tool: {name}")

    return tool.handler(**parsed_args)
