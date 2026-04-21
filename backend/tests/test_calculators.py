from app.services.calculators import loan_vs_invest, sip_future_value
from app.services.tax_calculator import compare_tax_regimes


def test_sip_future_value_is_deterministic():
    result = sip_future_value(25000, 12, 15)

    assert result["total_invested"] == 4500000
    assert result["future_value"] == 12614399.99
    assert result["estimated_gain"] == 8114399.99


def test_loan_vs_invest_prefers_higher_return_when_gap_positive():
    result = loan_vs_invest(1000000, 9, 12, 10)

    assert result["difference"] > 0
    assert result["math_preference"] == "invest"


def test_tax_comparison_returns_structured_regime_breakdown():
    result = compare_tax_regimes(2400000, 150000)

    assert result["better_regime"] in {"old", "new"}
    assert result["old_regime"]["taxable_income"] == 2175000
    assert result["new_regime"]["taxable_income"] == 2325000
    assert result["old_regime_tax"] == result["old_regime"]["total_tax"]
    assert result["new_regime_tax"] == result["new_regime"]["total_tax"]
