import logging
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth import decode_token
from app.models.user import User

logger = logging.getLogger(__name__)

def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.replace("Bearer ", "", 1)
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except (KeyError, ValueError, TypeError) as exc:
        logger.debug("Token decode failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid auth token")
    except Exception as exc:
        logger.warning("Unexpected token validation error: %s", exc, exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid auth token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
