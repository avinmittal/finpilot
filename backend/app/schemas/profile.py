from pydantic import BaseModel

class ProfileIn(BaseModel):
    annual_salary: int | None = None
    monthly_expenses: int | None = None
    risk_profile: str | None = None
    dependents: int | None = None
    city: str | None = None
    notes: str | None = None

class ProfileOut(ProfileIn):
    user_id: int
