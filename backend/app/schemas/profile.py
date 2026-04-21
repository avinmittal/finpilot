from pydantic import BaseModel, Field

class ProfileIn(BaseModel):
    annual_salary: int | None = Field(default=None, ge=0)
    monthly_expenses: int | None = Field(default=None, ge=0)
    risk_profile: str | None = Field(default=None, max_length=50)
    dependents: int | None = Field(default=None, ge=0, le=20)
    city: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=2000)

class ProfileOut(ProfileIn):
    user_id: int
