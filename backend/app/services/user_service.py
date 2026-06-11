from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.message import Message
from app.models.usage_stats import UsageStats
from app.models.user import User
from app.schemas.user import UserProfileUpdate, UserStats


class UserService:
    @staticmethod
    def get_profile(user: User) -> User:
        return user

    @staticmethod
    def update_profile(db: Session, user: User, data: UserProfileUpdate) -> User:
        if data.username is not None:
            existing = db.query(User).filter(User.username == data.username, User.id != user.id).first()
            if existing:
                raise ValueError("Username already taken")
            user.username = data.username
        if data.email is not None:
            existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
            if existing:
                raise ValueError("Email already registered")
            user.email = data.email
        if data.theme is not None:
            user.theme = data.theme
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_stats(db: Session, user_id: int) -> UserStats:
        total_chats = db.query(func.count(Chat.id)).filter(Chat.user_id == user_id).scalar() or 0
        total_messages = (
            db.query(func.count(Message.id))
            .join(Chat, Message.chat_id == Chat.id)
            .filter(Chat.user_id == user_id)
            .scalar()
            or 0
        )
        usage = db.query(UsageStats).filter(UsageStats.user_id == user_id).first()
        return UserStats(
            total_chats=total_chats,
            total_messages=total_messages,
            total_tokens=usage.total_tokens if usage else 0,
            total_requests=usage.total_requests if usage else 0,
        )
