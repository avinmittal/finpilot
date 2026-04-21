import csv
import io
from dataclasses import dataclass


NAME_COLUMNS = ("name", "holding", "security", "instrument", "symbol", "scheme")
ASSET_COLUMNS = ("asset_class", "asset", "category", "type")
VALUE_COLUMNS = ("value", "current_value", "market_value", "amount", "nav_value")


@dataclass(frozen=True)
class PortfolioHolding:
    name: str
    asset_class: str
    value: float


def _normalise_header(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_")


def _clean_money(value: str | None) -> float:
    if value is None:
        return 0.0
    cleaned = (
        str(value)
        .strip()
        .replace(",", "")
        .replace("₹", "")
        .replace("INR", "")
        .replace("Rs.", "")
        .replace("rs.", "")
    )
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError as exc:
        raise ValueError(f"Invalid money value: {value}") from exc


def _first_value(row: dict[str, str], candidates: tuple[str, ...]) -> str | None:
    for column in candidates:
        value = row.get(column)
        if value not in (None, ""):
            return value
    return None


def _parse_csv(raw_bytes: bytes) -> list[PortfolioHolding]:
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV must be UTF-8 encoded") from exc

    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample)
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise ValueError("CSV must include a header row")

    normalised_fieldnames = [_normalise_header(field) for field in reader.fieldnames]
    missing_value_column = not any(column in normalised_fieldnames for column in VALUE_COLUMNS)
    if missing_value_column:
        raise ValueError(
            "CSV must include one value column such as value, current_value, or market_value"
        )

    holdings: list[PortfolioHolding] = []
    for index, raw_row in enumerate(reader, start=2):
        row = {_normalise_header(key): (value or "").strip() for key, value in raw_row.items() if key}
        if not any(row.values()):
            continue

        name = _first_value(row, NAME_COLUMNS) or f"Row {index}"
        asset_class = (_first_value(row, ASSET_COLUMNS) or "Unclassified").strip().title()
        value = _clean_money(_first_value(row, VALUE_COLUMNS))
        if value < 0:
            raise ValueError(f"Row {index}: holding value cannot be negative")
        if value == 0:
            continue

        holdings.append(PortfolioHolding(name=name.strip(), asset_class=asset_class, value=value))

    if not holdings:
        raise ValueError("CSV did not contain any positive-value holdings")

    return holdings

def analyze_portfolio_csv(raw_bytes: bytes) -> dict:
    holdings = _parse_csv(raw_bytes)
    total = sum(holding.value for holding in holdings)

    if total <= 0:
        raise ValueError("Portfolio total must be positive")

    allocation: dict[str, float] = {}
    for holding in holdings:
        allocation[holding.asset_class] = allocation.get(holding.asset_class, 0.0) + holding.value

    allocation_summary = [
        {
            "asset_class": asset_class,
            "value": round(value, 2),
            "percentage": round(value / total * 100, 2),
        }
        for asset_class, value in sorted(allocation.items(), key=lambda item: item[1], reverse=True)
    ]

    sorted_holdings = sorted(holdings, key=lambda item: item.value, reverse=True)
    top_holdings = [
        {
            "name": holding.name,
            "asset_class": holding.asset_class,
            "value": round(holding.value, 2),
            "percentage": round(holding.value / total * 100, 2),
        }
        for holding in sorted_holdings[:10]
    ]

    concentration_top_3 = sum(holding.value for holding in sorted_holdings[:3]) / total * 100
    concentration_top_5 = sum(holding.value for holding in sorted_holdings[:5]) / total * 100
    largest = sorted_holdings[0]
    concentration_risk = (
        "high" if concentration_top_3 >= 60 or largest.value / total >= 0.35
        else "moderate" if concentration_top_3 >= 40
        else "low"
    )

    return {
        "total_value": round(total, 2),
        "holdings_count": len(holdings),
        "allocation": {item["asset_class"]: item["percentage"] for item in allocation_summary},
        "allocation_summary": allocation_summary,
        "concentration": {
            "top_3_pct": round(concentration_top_3, 2),
            "top_5_pct": round(concentration_top_5, 2),
            "largest_holding_pct": round(largest.value / total * 100, 2),
            "risk_level": concentration_risk,
        },
        "concentration_top_3_pct": round(concentration_top_3, 2),
        "top_holdings": top_holdings,
        "diagnostics": [
            "Review high concentration if a few holdings dominate the portfolio.",
            "Check whether asset allocation matches your risk profile and time horizon.",
        ],
    }
