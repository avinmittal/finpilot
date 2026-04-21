from dataclasses import dataclass


CESS_RATE = 0.04
STANDARD_DEDUCTION = 75000


@dataclass(frozen=True)
class TaxSlab:
    amount: float
    rate: float


@dataclass(frozen=True)
class TaxRegime:
    name: str
    label: str
    standard_deduction: float
    slabs: tuple[TaxSlab, ...]
    deduction_limit_note: str

    def calculate_base_tax(self, taxable_income: float) -> float:
        tax = 0.0
        remaining = max(0.0, taxable_income)
        for slab in self.slabs:
            if remaining <= 0:
                break
            taxable = min(remaining, slab.amount)
            tax += taxable * slab.rate
            remaining -= taxable
        return tax


OLD_REGIME = TaxRegime(
    name="old",
    label="Old regime",
    standard_deduction=STANDARD_DEDUCTION,
    deduction_limit_note="Uses declared old-regime deductions entered by the user.",
    slabs=(
        TaxSlab(250000, 0.00),
        TaxSlab(250000, 0.05),
        TaxSlab(500000, 0.20),
        TaxSlab(float("inf"), 0.30),
    ),
)

NEW_REGIME = TaxRegime(
    name="new",
    label="New regime",
    standard_deduction=STANDARD_DEDUCTION,
    deduction_limit_note="Ignores most old-regime deductions; standard deduction is applied.",
    slabs=(
        TaxSlab(400000, 0.00),
        TaxSlab(400000, 0.05),
        TaxSlab(400000, 0.10),
        TaxSlab(400000, 0.15),
        TaxSlab(400000, 0.20),
        TaxSlab(400000, 0.25),
        TaxSlab(float("inf"), 0.30),
    ),
)


def calculate_regime_tax(
    annual_salary: float,
    regime: TaxRegime,
    extra_deductions: float = 0.0,
) -> dict:
    taxable_income = max(0.0, annual_salary - regime.standard_deduction - extra_deductions)
    base_tax = regime.calculate_base_tax(taxable_income)
    cess = base_tax * CESS_RATE
    total_tax = base_tax + cess
    effective_rate = total_tax / annual_salary * 100 if annual_salary else 0.0

    return {
        "regime": regime.name,
        "label": regime.label,
        "annual_salary": round(annual_salary, 2),
        "standard_deduction": round(regime.standard_deduction, 2),
        "additional_deductions": round(extra_deductions, 2),
        "taxable_income": round(taxable_income, 2),
        "base_tax": round(base_tax, 2),
        "cess": round(cess, 2),
        "total_tax": round(total_tax, 2),
        "effective_rate_pct": round(effective_rate, 2),
        "note": regime.deduction_limit_note,
    }


def compare_tax_regimes(annual_salary: float, deductions_old_regime: float = 0.0) -> dict:
    if annual_salary < 0:
        raise ValueError("Annual salary cannot be negative")
    if deductions_old_regime < 0:
        raise ValueError("Old-regime deductions cannot be negative")

    old_result = calculate_regime_tax(
        annual_salary=annual_salary,
        regime=OLD_REGIME,
        extra_deductions=deductions_old_regime,
    )
    new_result = calculate_regime_tax(
        annual_salary=annual_salary,
        regime=NEW_REGIME,
        extra_deductions=0.0,
    )

    old_tax = old_result["total_tax"]
    new_tax = new_result["total_tax"]
    better = "old" if old_tax < new_tax else "new"
    savings = abs(old_tax - new_tax)

    return {
        "annual_salary": round(annual_salary, 2),
        "deductions_old_regime": round(deductions_old_regime, 2),
        "standard_deduction": STANDARD_DEDUCTION,
        "old_regime": old_result,
        "new_regime": new_result,
        "better_regime": better,
        "estimated_savings": round(savings, 2),
        "summary": (
            f"{'Old' if better == 'old' else 'New'} regime is lower by "
            f"about INR {savings:,.0f} on these simplified assumptions."
        ),
        "disclaimer": (
            "Simplified resident individual estimate. It excludes surcharge, rebates, "
            "capital gains, special income, marginal relief, and state-specific edge cases."
        ),
        # Backward-compatible fields for older frontend/tool responses.
        "taxable_old_regime": old_result["taxable_income"],
        "taxable_new_regime": new_result["taxable_income"],
        "old_regime_tax": old_tax,
        "new_regime_tax": new_tax,
    }
