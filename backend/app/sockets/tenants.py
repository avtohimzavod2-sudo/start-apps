import base64
import re

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import Tenant, get_session
from .auth import current_user

router = APIRouter()

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class CreateTenant(BaseModel):
    slug: str = Field(..., min_length=3, max_length=40)
    name: str = Field(..., min_length=1, max_length=80)
    color: str = Field(default="#6cf")
    icon_emoji: str = Field(default="✨", max_length=8)


class UpdateTenant(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color: str | None = None
    icon_emoji: str | None = Field(default=None, max_length=8)


def _serialize(t: Tenant) -> dict:
    return {
        "id": t.id,
        "slug": t.slug,
        "name": t.name,
        "owner_login": t.owner_login,
        "color": t.color,
        "icon_emoji": t.icon_emoji,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def _normalize_color(c: str) -> str:
    if not HEX_RE.match(c):
        raise HTTPException(400, "color must be hex like #6cf or #66ccff")
    if len(c) == 4:
        c = "#" + "".join(ch * 2 for ch in c[1:])
    return c.lower()


@router.post("")
def create(req: CreateTenant, login: str = Depends(current_user), db: Session = Depends(get_session)):
    slug = req.slug.lower().strip()
    if not SLUG_RE.match(slug):
        raise HTTPException(400, "slug must match ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
    if db.query(Tenant).filter(Tenant.slug == slug).first():
        raise HTTPException(409, "slug already taken")
    t = Tenant(
        slug=slug,
        name=req.name.strip(),
        owner_login=login,
        color=_normalize_color(req.color or "#6cf"),
        icon_emoji=(req.icon_emoji or "✨").strip() or "✨",
    )
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


@router.patch("/{slug}")
def update(slug: str, req: UpdateTenant, login: str = Depends(current_user), db: Session = Depends(get_session)):
    t = db.query(Tenant).filter(Tenant.slug == slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")
    if t.owner_login != login:
        raise HTTPException(403, "only owner can edit")
    if req.name is not None:
        t.name = req.name.strip()
    if req.color is not None:
        t.color = _normalize_color(req.color)
    if req.icon_emoji is not None:
        t.icon_emoji = req.icon_emoji.strip() or t.icon_emoji
    db.commit()
    db.refresh(t)
    return _serialize(t)


def _svg_icon(emoji: str, color: str, size: int = 512) -> str:
    # Простая SVG-иконка: квадрат цвета + эмодзи по центру.
    font = int(size * 0.55)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" rx="{size // 8}" fill="{color}"/>'
        f'<text x="50%" y="50%" font-size="{font}" text-anchor="middle" '
        f'dominant-baseline="central" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">'
        f'{emoji}</text></svg>'
    )


def _data_uri(svg: str) -> str:
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


@router.get("/{slug}/manifest.webmanifest")
def manifest(slug: str, db: Session = Depends(get_session)):
    # Открытая ручка без auth — PWA fetch'ит манифест без токена.
    t = db.query(Tenant).filter(Tenant.slug == slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")
    start_url = f"/app/{t.slug}"
    icon_192 = _data_uri(_svg_icon(t.icon_emoji, t.color, 192))
    icon_512 = _data_uri(_svg_icon(t.icon_emoji, t.color, 512))
    body = {
        "id": start_url,
        "name": t.name,
        "short_name": t.name[:12],
        "description": f"PWA-приложение {t.name} на платформе Start-Apps.",
        "start_url": start_url,
        "scope": start_url,
        "display": "standalone",
        "orientation": "portrait",
        "background_color": "#0a0a14",
        "theme_color": t.color,
        "icons": [
            {"src": icon_192, "sizes": "192x192", "type": "image/svg+xml", "purpose": "any maskable"},
            {"src": icon_512, "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable"},
        ],
    }
    return Response(
        content=__import__("json").dumps(body, ensure_ascii=False),
        media_type="application/manifest+json",
        headers={"Cache-Control": "no-cache"},
    )
