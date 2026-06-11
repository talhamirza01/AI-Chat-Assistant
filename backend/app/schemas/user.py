from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    theme: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    theme: Optional[str] = Field(None, pattern="^(light|dark)$")


class UserStats(BaseModel):
    total_chats: int
    total_messages: int
    total_tokens: int
    total_requests: int
