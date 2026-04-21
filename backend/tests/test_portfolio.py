import pytest

from app.services.portfolio import analyze_portfolio_csv


def test_portfolio_analyzer_accepts_common_column_aliases():
    raw = b"""Security,Category,Market Value
HDFC Index Fund,Equity,"250,000"
Liquid Fund,Debt,100000
Gold ETF,Gold,50000
"""

    result = analyze_portfolio_csv(raw)

    assert result["total_value"] == 400000
    assert result["holdings_count"] == 3
    assert result["allocation"]["Equity"] == 62.5
    assert result["concentration"]["top_3_pct"] == 100
    assert result["top_holdings"][0]["name"] == "HDFC Index Fund"


def test_portfolio_analyzer_rejects_missing_value_column():
    with pytest.raises(ValueError, match="value column"):
        analyze_portfolio_csv(b"name,asset_class\nABC,Equity\n")


def test_portfolio_analyzer_rejects_bad_money_value():
    with pytest.raises(ValueError, match="Invalid money value"):
        analyze_portfolio_csv(b"name,asset_class,value\nABC,Equity,not-a-number\n")
