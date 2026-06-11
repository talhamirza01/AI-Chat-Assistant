import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, get_db
from app.middleware.rate_limit import limiter
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatHistoryResponse, ChatListItem, ChatRenameRequest, ChatResponse, ChatSendRequest, MessageResponse
from app.services.ai_service import AIService
from app.services.chat_service import ChatService
from app.utils.deps import get_current_user
from app.utils.sanitize import sanitize_input

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/send")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    data: ChatSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = sanitize_input(data.message)
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    chat = None
    if data.chat_id:
        chat = ChatService.get_chat(db, data.chat_id, current_user.id)
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    else:
        chat = ChatService.create_chat(db, current_user.id)

    if data.regenerate:
        ChatService.remove_last_assistant_message(db, chat.id)
        last_user = (
            db.query(Message)
            .filter(Message.chat_id == chat.id, Message.role == "user")
            .order_by(Message.created_at.desc())
            .first()
        )
        if not last_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No message to regenerate")
        content = last_user.content
    else:
        ChatService.add_message(db, chat.id, "user", content)
        ChatService.auto_title(db, chat.id, content)

    history = ChatService.get_messages_for_context(db, chat.id)
    if not data.regenerate:
        history = history[:-1]

    model = data.model or None
    ai = AIService(model=model)
    chat_id = chat.id
    user_id = current_user.id
    system_prompt = data.system_prompt

    async def event_stream():
        full_response = ""
        try:
            yield f"data: {json.dumps({'type': 'start', 'chat_id': chat_id})}\n\n"

            async for chunk in ai.stream_response(history, content, system_prompt):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            session = SessionLocal()
            try:
                ChatService.add_message(session, chat_id, "assistant", full_response)
                tokens = AIService.estimate_tokens(content + full_response)
                ChatService.update_usage(session, user_id, tokens)
            finally:
                session.close()

            yield f"data: {json.dumps({'type': 'done', 'chat_id': chat_id})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history", response_model=ChatHistoryResponse)
def get_history(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chats, total = ChatService.get_history(db, current_user.id, search, skip, limit)
    return ChatHistoryResponse(
        chats=[ChatListItem(**c) for c in chats],
        total=total,
    )


@router.get("/models/list")
def list_models(current_user: User = Depends(get_current_user)):
    return {"models": AIService.get_available_models()}


@router.post("/create", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = ChatService.create_chat(db, current_user.id)
    return ChatResponse(id=chat.id, title=chat.title, created_at=chat.created_at, messages=[])


@router.put("/rename/{chat_id}", response_model=ChatResponse)
def rename_chat(
    chat_id: int,
    data: ChatRenameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = ChatService.rename_chat(db, chat_id, current_user.id, data.title)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return ChatResponse(id=chat.id, title=chat.title, created_at=chat.created_at, messages=[])


@router.delete("/delete/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not ChatService.delete_chat(db, chat_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return None


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = ChatService.get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        messages=[MessageResponse.model_validate(m) for m in chat.messages],
    )
