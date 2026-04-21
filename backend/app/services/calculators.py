from math import pow

from app.services.tax_calculator import compare_tax_regimes

def sip_future_value(monthly_investment: float, annual_return_pct: float, years: int) -> dict:
    if monthly_investment <= 0:
        raise ValueError("Monthly investment must be positive")
    if annual_return_pct < 0:
        raise ValueError("Annual return cannot be negative")
    if years <= 0:
        raise ValueError("Investment period must be positive")
    r = annual_return_pct / 100 / 12
    n = years * 12
    if r == 0:
        fv = monthly_investment * n
    else:
        fv = monthly_investment * (((pow(1 + r, n) - 1) / r) * (1 + r))
    invested = monthly_investment * n
    return {
        "monthly_investment": monthly_investment,
        "annual_return_pct": annual_return_pct,
        "years": years,
        "total_invested": round(invested, 2),
        "future_value": round(fv, 2),
        "estimated_gain": round(fv - invested, 2),
        "assumption": "Monthly investments are made at the beginning of each month.",
    }

def loan_vs_invest(lump_sum: float, loan_rate_pct: float, expected_return_pct: float, years: int) -> dict:
    if lump_sum <= 0:
        raise ValueError("Lump sum must be positive")
    if loan_rate_pct < 0 or expected_return_pct < 0:
        raise ValueError("Rates cannot be negative")
    if years <= 0:
        raise ValueError("Comparison period must be positive")
    loan_growth = lump_sum * ((1 + loan_rate_pct / 100) ** years)
    invest_growth = lump_sum * ((1 + expected_return_pct / 100) ** years)
    difference = invest_growth - loan_growth
    return {
        "lump_sum": round(lump_sum, 2),
        "years": years,
        "loan_rate_pct": loan_rate_pct,
        "expected_return_pct": expected_return_pct,
        "interest_saved_equivalent": round(loan_growth - lump_sum, 2),
        "investment_gain_equivalent": round(invest_growth - lump_sum, 2),
        "difference": round(difference, 2),
        "math_preference": "invest" if difference > 0 else "prepay_loan",
        "assumption": "Ignores taxes, liquidity needs, prepayment charges, and market risk.",
    }
