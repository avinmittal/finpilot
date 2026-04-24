import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import ChatMessage, User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import generate_financial_response
from app.services.profile_service import get_or_create_profile

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(current_user.id, db)
    profile_context = {
        "annual_salary": profile.annual_salary,
        "monthly_expenses": profile.monthly_expenses,
        "risk_profile": profile.risk_profile,
        "dependents": profile.dependents,
        "city": profile.city,
        "notes": profile.notes,
    }

    try:
        reply = generate_financial_response(payload.message, profile_context)
    except Exception:
        logger.exception("LLM generation failed for user %s", current_user.id)
        reply = "Sorry, I ran into an error while processing your request. Please try again."

    db.add(ChatMessage(user_id=current_user.id, role="user", content=payload.message))
    db.add(ChatMessage(user_id=current_user.id, role="assistant", content=reply))
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
