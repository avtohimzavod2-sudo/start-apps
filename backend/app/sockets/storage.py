from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import KV, get_session
from .auth import current_user

router = APIRouter()


class SetRequest(BaseModel):
    key: str
    value: Any


@router.get("/get/{key}")
def get(key: str, login: str = Depends(current_user), db: Session = Depends(get_session)):
    row = db.get(KV, (login, key))
    if row is None:
        raise HTTPException(404, "key not found")
    return {"key": key, "value": row.value}


@router.post("/set")
def set_value(req: SetRequest, login: str = Depends(current_user), db: Session = Depends(get_session)):
    row = db.get(KV, (login, req.key))
    if row is None:
        db.add(KV(user_login=login, key=req.key, value=req.value))
    else:
        row.value = req.value
    db.commit()
    return {"ok": True, "key": req.key}


@router.delete("/del/{key}")
def delete(key: str, login: str = Depends(current_user), db: Session = Depends(get_session)):
    row = db.get(KV, (login, key))
    if row is not None:
        db.delete(row)
        db.commit()
    return {"ok": True, "deleted": row is not None}


@router.get("/keys")
def keys(login: str = Depends(current_user), db: Session = Depends(get_session)):
    rows = db.query(KV.key).filter(KV.user_login == login).all()
    return {"keys": [r[0] for r in rows]}
