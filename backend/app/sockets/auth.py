import os
import time

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import User, get_session

router = APIRouter()

_SECRET = os.getenv("SA_AUTH_SECRET", "dev-secret")
_ALGO = "HS256"
_TTL = 60 * 60 * 24 * 7  # 7 дней

_pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class Credentials(BaseModel):
    login: str
    password: str


def _issue(login: str) -> str:
    payload = {"sub": login, "iat": int(time.time()), "exp": int(time.time()) + _TTL}
    return jwt.encode(payload, _SECRET, algorithm=_ALGO)


def current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, _SECRET, algorithms=[_ALGO])
    except JWTError:
        raise HTTPException(401, "invalid token")
    return payload["sub"]


@router.post("/register")
def register(c: Credentials, db: Session = Depends(get_session)):
    if db.get(User, c.login):
        raise HTTPException(409, "user exists")
    db.add(User(login=c.login, password_hash=_pwd.hash(c.password)))
    db.commit()
    return {"token": _issue(c.login)}


@router.post("/login")
def login(c: Credentials, db: Session = Depends(get_session)):
    u = db.get(User, c.login)
    if not u or not _pwd.verify(c.password, u.password_hash):
        raise HTTPException(401, "bad credentials")
    return {"token": _issue(c.login)}


@router.get("/me")
def me(login: str = Depends(current_user), db: Session = Depends(get_session)):
    u = db.get(User, login)
    if not u:
        raise HTTPException(404, "user gone")
    return {"login": u.login}
