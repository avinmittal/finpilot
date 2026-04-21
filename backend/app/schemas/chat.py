from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=4000)

class ChatResponse(BaseModel):
    reply: str
