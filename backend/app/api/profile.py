from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import ProfileIn, ProfileOut
from app.services.profile_service import get_or_create_profile

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(current_user.id, db)
    return ProfileOut(
        user_id=current_user.id,
        annual_salary=profile.annual_salary,
        monthly_expenses=profile.monthly_expenses,
        risk_profile=profile.risk_profile,
        dependents=profile.dependents,
        city=profile.city,
        notes=profile.notes,
    )

@router.put("", response_model=ProfileOut)
def update_profile(payload: ProfileIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(current_user.id, db)
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return ProfileOut(user_id=current_user.id, **payload.model_dump())
