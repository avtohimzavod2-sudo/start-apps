"""Розетка sa.bookings — записи на слоты конкретного tenant'а.
UNIQUE(tenant, date, time) на уровне БД защищает от двойных бронирований.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import Booking, Tenant, get_session
from .auth import current_user

router = APIRouter()


class CreateBooking(BaseModel):
    service: str = Field(..., min_length=1, max_length=80)
    price: int = Field(0, ge=0)
    duration: int = Field(30, ge=1, le=480)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")


def _serialize(b: Booking) -> dict:
    return {
        "id": b.id,
        "service": b.service,
        "price": b.price,
        "duration": b.duration,
        "date": b.date,
        "time": b.time,
        "user_login": b.user_login,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


def _resolve_tenant(slug: str, db: Session) -> Tenant:
    t = db.query(Tenant).filter(Tenant.slug == slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")
    return t


@router.post("/{slug}/bookings")
def create(
    slug: str,
    req: CreateBooking,
    login: str = Depends(current_user),
    db: Session = Depends(get_session),
):
    t = _resolve_tenant(slug, db)
    b = Booking(
        tenant_id=t.id,
        user_login=login,
        service=req.service.strip(),
        price=req.price,
        duration=req.duration,
        date=req.date,
        time=req.time,
    )
    db.add(b)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "slot already taken")
    db.refresh(b)
    return _serialize(b)


@router.get("/{slug}/bookings/taken")
def taken(
    slug: str,
    date: str,
    _: str = Depends(current_user),
    db: Session = Depends(get_session),
):
    """Список занятых HH:MM на указанную дату — для отрисовки серых слотов."""
    t = _resolve_tenant(slug, db)
    rows = (
        db.query(Booking.time)
        .filter(Booking.tenant_id == t.id, Booking.date == date)
        .all()
    )
    return {"date": date, "taken": sorted({r[0] for r in rows})}


@router.get("/{slug}/bookings/mine")
def mine(
    slug: str,
    login: str = Depends(current_user),
    db: Session = Depends(get_session),
):
    t = _resolve_tenant(slug, db)
    rows = (
        db.query(Booking)
        .filter(Booking.tenant_id == t.id, Booking.user_login == login)
        .order_by(Booking.date, Booking.time)
        .all()
    )
    return {"bookings": [_serialize(b) for b in rows]}
