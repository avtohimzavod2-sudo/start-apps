import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import Tenant, get_session
from .auth import current_user

router = APIRouter()

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")


class CreateTenant(BaseModel):
    slug: str = Field(..., min_length=3, max_length=40)
    name: str = Field(..., min_length=1, max_length=80)


def _serialize(t: Tenant) -> dict:
    return {
        "id": t.id,
        "slug": t.slug,
        "name": t.name,
        "owner_login": t.owner_login,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


@router.post("")
def create(req: CreateTenant, login: str = Depends(current_user), db: Session = Depends(get_session)):
    slug = req.slug.lower().strip()
    if not SLUG_RE.match(slug):
        raise HTTPException(400, "slug must match ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
    if db.query(Tenant).filter(Tenant.slug == slug).first():
        raise HTTPException(409, "slug already taken")
    t = Tenant(slug=slug, name=req.name.strip(), owner_login=login)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _serialize(t)


@router.get("")
def list_my(login: str = Depends(current_user), db: Session = Depends(get_session)):
    rows = db.query(Tenant).filter(Tenant.owner_login == login).order_by(Tenant.created_at.desc()).all()
    return {"tenants": [_serialize(t) for t in rows]}


@router.get("/{slug}")
def get_one(slug: str, _: str = Depends(current_user), db: Session = Depends(get_session)):
    t = db.query(Tenant).filter(Tenant.slug == slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")
    return _serialize(t)
