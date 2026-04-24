from sqlalchemy.orm import Session
from app.models.user import FinancialProfile


def get_or_create_profile(user_id: int, db: Session) -> FinancialProfile:
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        profile = FinancialProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile
