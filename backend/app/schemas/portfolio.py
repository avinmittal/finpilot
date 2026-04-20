from pydantic import BaseModel

class PortfolioSummary(BaseModel):
    total_value: float
    allocation: dict[str, float]
    concentration_top_3_pct: float
    holdings_count: int
    top_holdings: list[dict]
