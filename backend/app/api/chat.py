from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import ChatMessage, FinancialProfile, User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import generate_financial_response

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    profile_context = {
        "annual_salary": getattr(profile, "annual_salary", None),
        "monthly_expenses": getattr(profile, "monthly_expenses", None),
        "risk_profile": getattr(profile, "risk_profile", None),
        "dependents": getattr(profile, "dependents", None),
        "city": getattr(profile, "city", None),
        "notes": getattr(profile, "notes", None),
    }

    user_msg = ChatMessage(user_id=current_user.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    reply = generate_financial_response(payload.message, profile_context)

    assistant_msg = ChatMessage(user_id=current_user.id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(reply=reply)

@router.get("/history")
def history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )
    return [{"role": r.role, "content": r.content, "created_at": str(r.created_at)} for r in rows]
