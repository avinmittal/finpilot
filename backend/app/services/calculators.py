from math import pow

def sip_future_value(monthly_investment: float, annual_return_pct: float, years: int) -> dict:
    if monthly_investment <= 0 or annual_return_pct < 0 or years <= 0:
        raise ValueError("Invalid SIP inputs")
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
    }

def loan_vs_invest(lump_sum: float, loan_rate_pct: float, expected_return_pct: float, years: int) -> dict:
    if lump_sum <= 0 or loan_rate_pct < 0 or expected_return_pct < 0 or years <= 0:
        raise ValueError("Invalid loan-vs-invest inputs")
    loan_growth = lump_sum * ((1 + loan_rate_pct / 100) ** years)
    invest_growth = lump_sum * ((1 + expected_return_pct / 100) ** years)
    return {
        "lump_sum": round(lump_sum, 2),
        "years": years,
        "loan_rate_pct": loan_rate_pct,
        "expected_return_pct": expected_return_pct,
        "interest_saved_equivalent": round(loan_growth - lump_sum, 2),
        "investment_gain_equivalent": round(invest_growth - lump_sum, 2),
        "difference": round(invest_growth - loan_growth, 2),
    }

def _old_regime_tax(taxable_income: float) -> float:
    slabs = [
        (250000, 0.0),
        (250000, 0.05),
        (500000, 0.20),
        (float("inf"), 0.30),
    ]
    tax = 0.0
    remaining = taxable_income
    for slab_amount, rate in slabs:
        if remaining <= 0:
            break
        taxable = min(remaining, slab_amount)
        tax += taxable * rate
        remaining -= taxable
    return tax

def _new_regime_tax(taxable_income: float) -> float:
    # AY 2026-27 style slab ladder for individuals under default new regime
    slabs = [
        (400000, 0.00),
        (400000, 0.05),
        (400000, 0.10),
        (400000, 0.15),
        (400000, 0.20),
        (400000, 0.25),
        (float("inf"), 0.30),
    ]
    tax = 0.0
    remaining = taxable_income
    for slab_amount, rate in slabs:
        if remaining <= 0:
            break
        taxable = min(remaining, slab_amount)
        tax += taxable * rate
        remaining -= taxable
    return tax

def compare_tax_regimes(annual_salary: float, deductions_old_regime: float = 0.0) -> dict:
    if annual_salary < 0 or deductions_old_regime < 0:
        raise ValueError("Invalid tax inputs")
    standard_deduction = 75000
    taxable_old = max(0.0, annual_salary - standard_deduction - deductions_old_regime)
    taxable_new = max(0.0, annual_salary - standard_deduction)

    old_tax = _old_regime_tax(taxable_old)
    new_tax = _new_regime_tax(taxable_new)

    old_tax_total = round(old_tax * 1.04, 2)  # 4% cess
    new_tax_total = round(new_tax * 1.04, 2)

    better = "old" if old_tax_total < new_tax_total else "new"
    savings = abs(old_tax_total - new_tax_total)

    return {
        "annual_salary": round(annual_salary, 2),
        "deductions_old_regime": round(deductions_old_regime, 2),
        "standard_deduction": standard_deduction,
        "taxable_old_regime": round(taxable_old, 2),
        "taxable_new_regime": round(taxable_new, 2),
        "old_regime_tax": old_tax_total,
        "new_regime_tax": new_tax_total,
        "better_regime": better,
        "estimated_savings": round(savings, 2),
    }
