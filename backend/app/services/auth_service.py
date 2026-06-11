from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.usage_stats import UsageStats
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister

settings = get_settings()


class AuthService:
    @staticmethod
    def register(db: Session, data: UserRegister) -> User:
        if db.query(User).filter(User.email == data.email).first():
            raise ValueError("Email already registered")
        if db.query(User).filter(User.username == data.username).first():
            raise ValueError("Username already taken")

        user = User(
            username=data.username,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role="user",
        )
        db.add(user)
        db.flush()

        usage = UsageStats(user_id=user.id, total_tokens=0, total_requests=0)
        db.add(usage)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, data: UserLogin) -> tuple[str, str]:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid email or password")

        access_token = create_access_token({"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        db.add(RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at))
        db.commit()

        return access_token, refresh_token

    @staticmethod
    def logout(db: Session, refresh_token: str) -> None:
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).delete()
        db.commit()

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> str:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        stored = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if not stored or stored.expires_at < datetime.now(timezone.utc):
            raise ValueError("Refresh token expired or revoked")

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise ValueError("User not found")

        return create_access_token({"sub": str(user.id), "role": user.role})
