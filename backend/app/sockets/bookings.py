"""Розетка sa.bookings — записи на слоты конкретного tenant'а.
UNIQUE(tenant, date, time) на уровне БД защищает от двойных бронирований.
Безопасность: клиент не задаёт price/duration — бэк подтягивает их из tenant.config
по имени услуги, иначе клиент мог бы забронировать «бесплатно» что угодно.
"""
from datetime import date as date_cls, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import Booking, Tenant, get_session
from .auth import current_user

router = APIRouter()

BISHKEK = ZoneInfo("Asia/Bishkek")


class CreateBooking(BaseModel):
    service: str = Field(..., min_length=1, max_length=80)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    # HH:MM с реальным диапазоном часов 00-23 и минут 00-59
    time: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")


class BookingError(Exception):
    """Бизнес-ошибка бронирования. status — HTTP-код для ручки, code — машинный идентификатор."""
    def __init__(self, status: int, message: str, code: str = "booking_error"):
        super().__init__(message)
        self.status = status
        self.message = message
        self.code = code


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


def _today_bishkek() -> date_cls:
    return datetime.now(BISHKEK).date()


def perform_create(t: Tenant, login: str, db: Session, service_name: str, date_str: str, time_str: str) -> Booking:
    """Единственный путь создания брони — используется и HTTP-ручкой, и AI-скиллом.
    Сама находит услугу в tenant.config (защита от подмены цены клиентом).
    Поднимает BookingError при бизнес-ошибках, IntegrityError ловит и переводит в 409.
    """
    services = (t.config or {}).get("services", []) or []
    svc = next((s for s in services if (s.get("name") or "").lower() == service_name.lower()), None)
    if not svc:
        names = [s.get("name") for s in services]
        raise BookingError(400, f"услуга '{service_name}' не найдена. Доступные: {names}", "service_not_found")

    try:
        booking_date = date_cls.fromisoformat(date_str)
    except ValueError:
        raise BookingError(400, "неверный формат даты", "bad_date")
    if booking_date < _today_bishkek():
        raise BookingError(400, "нельзя бронировать в прошлое", "past_date")

    b = Booking(
        tenant_id=t.id,
        user_login=login,
        service=svc["name"],
        price=int(svc.get("price", 0) or 0),
        duration=int(svc.get("duration", 30) or 30),
        date=date_str,
        time=time_str,
    )
    db.add(b)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise BookingError(409, "слот уже занят", "slot_taken")
    db.refresh(b)
    return b


@router.post("/{slug}/bookings")
def create(
    slug: str,
    req: CreateBooking,
    login: str = Depends(current_user),
    db: Session = Depends(get_session),
):
    t = _resolve_tenant(slug, db)
    try:
        b = perform_create(t, login, db, req.service, req.date, req.time)
    except BookingError as e:
        raise HTTPException(e.status, e.message)
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


@router.delete("/{slug}/bookings/{booking_id}")
def cancel(
    slug: str,
    booking_id: int,
    login: str = Depends(current_user),
    db: Session = Depends(get_session),
):
    """Отмена записи. Клиент может отменить свою; владелец — любую внутри tenant'а."""
    t = _resolve_tenant(slug, db)
    b = db.get(Booking, booking_id)
    if not b or b.tenant_id != t.id:
        raise HTTPException(404, "booking not found")
    if b.user_login != login and t.owner_login != login:
        raise HTTPException(403, "not your booking")
    db.delete(b)
    db.commit()
    return {"ok": True, "id": booking_id}
