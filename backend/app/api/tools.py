from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.api.deps import get_current_user
from app.models.user import User
from app.services.calculators import compare_tax_regimes
from app.services.portfolio import analyze_portfolio_csv

router = APIRouter(prefix="/tools", tags=["tools"])

@router.post("/portfolio/analyze")
async def portfolio_analyze(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty")
    try:
        return analyze_portfolio_csv(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/tax/compare")
def tax_compare(
    annual_salary: float,
    deductions_old_regime: float = 0.0,
    current_user: User = Depends(get_current_user),
):
    try:
        return compare_tax_regimes(annual_salary, deductions_old_regime)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
