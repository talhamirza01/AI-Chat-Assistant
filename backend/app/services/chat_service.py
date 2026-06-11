from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.chat import Chat
from app.models.message import Message
from app.models.usage_stats import UsageStats
from app.utils.sanitize import sanitize_input


class ChatService:
    @staticmethod
    def create_chat(db: Session, user_id: int, title: str = "New Chat") -> Chat:
        chat = Chat(user_id=user_id, title=title)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat

    @staticmethod
    def get_chat(db: Session, chat_id: int, user_id: int) -> Optional[Chat]:
        return (
            db.query(Chat)
            .options(joinedload(Chat.messages))
            .filter(Chat.id == chat_id, Chat.user_id == user_id)
            .first()
        )

    @staticmethod
    def get_history(
        db: Session, user_id: int, search: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> Tuple[List[dict], int]:
        query = db.query(Chat).filter(Chat.user_id == user_id)
        if search:
            query = query.filter(Chat.title.ilike(f"%{search}%"))

        total = query.count()
        chats = query.order_by(Chat.created_at.desc()).offset(skip).limit(limit).all()

        result = []
        for chat in chats:
            msg_count = db.query(func.count(Message.id)).filter(Message.chat_id == chat.id).scalar() or 0
            result.append(
                {
                    "id": chat.id,
                    "title": chat.title,
                    "created_at": chat.created_at,
                    "message_count": msg_count,
                }
            )
        return result, total

    @staticmethod
    def rename_chat(db: Session, chat_id: int, user_id: int, title: str) -> Optional[Chat]:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            return None
        chat.title = sanitize_input(title)
        db.commit()
        db.refresh(chat)
        return chat

    @staticmethod
    def delete_chat(db: Session, chat_id: int, user_id: int) -> bool:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            return False
        db.delete(chat)
        db.commit()
        return True

    @staticmethod
    def add_message(db: Session, chat_id: int, role: str, content: str) -> Message:
        message = Message(chat_id=chat_id, role=role, content=content)
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def get_messages_for_context(db: Session, chat_id: int, limit: int = 20) -> List[dict]:
        messages = (
            db.query(Message)
            .filter(Message.chat_id == chat_id, Message.role.in_(["user", "assistant"]))
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        messages.reverse()
        return [{"role": m.role, "content": m.content} for m in messages]

    @staticmethod
    def remove_last_assistant_message(db: Session, chat_id: int) -> None:
        last = (
            db.query(Message)
            .filter(Message.chat_id == chat_id, Message.role == "assistant")
            .order_by(Message.created_at.desc())
            .first()
        )
        if last:
            db.delete(last)
            db.commit()

    @staticmethod
    def update_usage(db: Session, user_id: int, tokens: int) -> None:
        stats = db.query(UsageStats).filter(UsageStats.user_id == user_id).first()
        if stats:
            stats.total_tokens += tokens
            stats.total_requests += 1
            db.commit()

    @staticmethod
    def auto_title(db: Session, chat_id: int, first_message: str) -> None:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat and chat.title == "New Chat":
            title = first_message[:50].strip()
            if len(first_message) > 50:
                title += "..."
            chat.title = title
            db.commit()
