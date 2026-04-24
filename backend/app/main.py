import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.chat import router as chat_router
from app.api.tools import router as tools_router
from app.core.config import settings
from app.db.session import Base, engine

os.makedirs("data", exist_ok=True)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinPilot API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(tools_router, prefix="/api")
