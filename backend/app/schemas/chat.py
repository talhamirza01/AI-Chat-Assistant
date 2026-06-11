from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=32000)


class ChatSendRequest(BaseModel):
    chat_id: Optional[int] = None
    message: str = Field(..., min_length=1, max_length=32000)
    model: Optional[str] = None
    regenerate: bool = False
    system_prompt: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatListItem(BaseModel):
    id: int
    title: str
    created_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatRenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ChatHistoryResponse(BaseModel):
    chats: List[ChatListItem]
    total: int
