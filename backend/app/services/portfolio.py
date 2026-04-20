import csv
import io

def analyze_portfolio_csv(raw_bytes: bytes) -> dict:
    text = raw_bytes.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise ValueError("Empty CSV")

    parsed = []
    total = 0.0
    for row in rows:
        name = (row.get("name") or row.get("holding") or "").strip() or "Unknown"
        asset_class = (row.get("asset_class") or row.get("asset") or "unknown").strip().lower()
        value = float(row.get("value") or row.get("current_value") or 0)
        parsed.append({"name": name, "asset_class": asset_class, "value": value})
        total += value

    if total <= 0:
        raise ValueError("Portfolio total must be positive")

    allocation = {}
    for item in parsed:
        allocation[item["asset_class"]] = allocation.get(item["asset_class"], 0.0) + item["value"]

    allocation_pct = {k: round(v / total * 100, 2) for k, v in allocation.items()}
    top_holdings = sorted(parsed, key=lambda x: x["value"], reverse=True)[:5]
    concentration_top_3 = sum(h["value"] for h in top_holdings[:3]) / total * 100

    for h in top_holdings:
        h["pct"] = round(h["value"] / total * 100, 2)

    return {
        "total_value": round(total, 2),
        "allocation": allocation_pct,
        "concentration_top_3_pct": round(concentration_top_3, 2),
        "holdings_count": len(parsed),
        "top_holdings": top_holdings,
    }
