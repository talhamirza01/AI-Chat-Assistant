from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.rate_limit import limiter
from app.schemas.auth import RefreshTokenRequest, TokenResponse, UserLogin, UserRegister
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    try:
        user = AuthService.register(db, data)
        access_token, refresh_token = AuthService.login(
            db, UserLogin(email=data.email, password=data.password)
        )
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    try:
        access_token, refresh_token = AuthService.login(db, data)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    AuthService.logout(db, data.refresh_token)
    return None


@router.post("/refresh", response_model=dict)
@limiter.limit("30/minute")
def refresh_token(request: Request, data: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        access_token = AuthService.refresh_access_token(db, data.refresh_token)
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
