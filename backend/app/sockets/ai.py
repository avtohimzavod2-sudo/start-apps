"""Розетка sa.ai — Claude через Anthropic API с tool-use.
Скиллы исполняются на бэке через те же таблицы, что и HTTP-эндпойнты
(единственный путь создания брони — bookings.perform_create).

Tool-имена и параметры в ASCII (требование Anthropic: ^[a-zA-Z0-9_-]{1,64}$),
описания — на русском.

Паки скиллов выбираются по template_id. Старт — барбершоп.
"""
import json
import os
import urllib.error
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import Booking, Tenant, get_session
from .auth import current_user
from .bookings import BookingError, perform_create

router = APIRouter()

MODEL = "claude-sonnet-4-6"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MAX_HISTORY_TURNS = 30
MAX_TOOL_ITERATIONS = 5
BISHKEK = ZoneInfo("Asia/Bishkek")
WEEKDAYS_RU = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]


# ───────────────────────── Скиллы барбершопа ─────────────────────────

def _gen_times() -> list[str]:
    return [f"{h:02d}:{m:02d}" for h in range(10, 20) for m in (0, 30)]


def skill_show_services(t: Tenant, login: str, db: Session, args: dict):
    services = (t.config or {}).get("services", [])
    return {"services": services, "currency": "сом"}


def skill_free_slots(t: Tenant, login: str, db: Session, args: dict):
    date = args.get("date")
    if not date:
        return {"error": "missing 'date' (YYYY-MM-DD)"}
    taken = {
        r[0] for r in db.query(Booking.time)
        .filter(Booking.tenant_id == t.id, Booking.date == date)
        .all()
    }
    free = [x for x in _gen_times() if x not in taken]
    return {"date": date, "free": free}


def skill_create_booking(t: Tenant, login: str, db: Session, args: dict):
    service = (args.get("service") or "").strip()
    date = args.get("date")
    time = args.get("time")
    if not (service and date and time):
        return {"error": "need service, date (YYYY-MM-DD) and time (HH:MM)"}
    try:
        b = perform_create(t, login, db, service, date, time)
    except BookingError as e:
        return {"error": e.message, "code": e.code}
    return {
        "ok": True, "id": b.id,
        "service": b.service, "date": b.date, "time": b.time,
        "price": b.price, "duration": b.duration,
    }


def skill_my_bookings(t: Tenant, login: str, db: Session, args: dict):
    rows = (
        db.query(Booking)
        .filter(Booking.tenant_id == t.id, Booking.user_login == login)
        .order_by(Booking.date, Booking.time)
        .all()
    )
    return {"bookings": [
        {"id": b.id, "service": b.service, "date": b.date, "time": b.time, "price": b.price}
        for b in rows
    ]}


def skill_cancel(t: Tenant, login: str, db: Session, args: dict):
    bid = args.get("id")
    if not isinstance(bid, int):
        return {"error": "need integer 'id'"}
    b = db.get(Booking, bid)
    if not b or b.tenant_id != t.id:
        return {"error": "booking not found"}
    if b.user_login != login and t.owner_login != login:
        return {"error": "not your booking"}
    info = {"id": b.id, "service": b.service, "date": b.date, "time": b.time}
    db.delete(b)
    db.commit()
    return {"ok": True, "cancelled": info}


BARBERSHOP_TOOLS = [
    {
        "name": "show_services",
        "description": "Показать список услуг барбершопа с ценами в сомах и длительностью в минутах.",
        "input_schema": {"type": "object", "properties": {}},
        "_exec": skill_show_services,
    },
    {
        "name": "free_slots",
        "description": "Получить свободные времена (HH:MM) на указанную дату. Используй когда клиент спрашивает «когда можно» или хочет записаться.",
        "input_schema": {
            "type": "object",
            "properties": {"date": {"type": "string", "description": "Дата в формате YYYY-MM-DD"}},
            "required": ["date"],
        },
        "_exec": skill_free_slots,
    },
    {
        "name": "create_booking",
        "description": "Забронировать слот для текущего клиента. Перед вызовом сверь имя услуги с show_services и свободность слота с free_slots.",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string", "description": "Точное название услуги из show_services"},
                "date":    {"type": "string", "description": "Дата YYYY-MM-DD"},
                "time":    {"type": "string", "description": "Время HH:MM"},
            },
            "required": ["service", "date", "time"],
        },
        "_exec": skill_create_booking,
    },
    {
        "name": "my_bookings",
        "description": "Список собственных записей текущего клиента (для показа или для получения id перед отменой).",
        "input_schema": {"type": "object", "properties": {}},
        "_exec": skill_my_bookings,
    },
    {
        "name": "cancel_booking",
        "description": "Отменить запись по id. Сначала возьми id из my_bookings и подтверди отмену с клиентом.",
        "input_schema": {
            "type": "object",
            "properties": {"id": {"type": "integer", "description": "ID записи"}},
            "required": ["id"],
        },
        "_exec": skill_cancel,
    },
]


TOOLS_BY_TEMPLATE = {
    "barbershop": BARBERSHOP_TOOLS,
}


# ───────────────────────── Системный промпт ─────────────────────────

def _system_prompt(t: Tenant) -> str:
    cfg = t.config or {}
    now = datetime.now(BISHKEK)
    today_line = (
        f"Сегодня: {now.date().isoformat()} ({WEEKDAYS_RU[now.weekday()]}), "
        f"сейчас {now.strftime('%H:%M')} (часовой пояс Бишкек)."
    )
    if t.template_id == "barbershop":
        return (
            f"Ты — AI-ассистент барбершопа «{t.name}» в Бишкеке.\n"
            f"{today_line}\n"
            f"Мастер: {cfg.get('master_name', '—')}. График: {cfg.get('schedule', '—')}. "
            f"Адрес: {cfg.get('address', '—')}.\n\n"
            f"Инструменты — используй вместо того чтобы выдумывать данные:\n"
            f" • show_services — реальный прайс\n"
            f" • free_slots(date) — реальное расписание на дату\n"
            f" • create_booking(service, date, time) — реально бронирует слот\n"
            f" • my_bookings — записи текущего клиента\n"
            f" • cancel_booking(id) — отменяет\n\n"
            f"Правила:\n"
            f" - Отвечай ТОЛЬКО про этот барбершоп. Постороннее — вежливо отклоняй.\n"
            f" - Русский язык по-умолчанию, кыргызский — если клиент пишет на нём.\n"
            f" - Кратко, дружелюбно, 1–3 предложения. Цены — в сомах.\n"
            f" - «Завтра», «сегодня», «через 2 дня» вычисляй относительно текущей даты выше.\n"
            f" - Перед бронированием подтверди детали клиенту."
        )
    return f"Ты — AI-ассистент бизнеса «{t.name}». {today_line} Отвечай кратко и по делу."


# ───────────────────────── Anthropic call ─────────────────────────

def _anthropic_call(api_key: str, payload: dict) -> dict:
    req = urllib.request.Request(
        ANTHROPIC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")[:500]
        raise HTTPException(502, f"anthropic {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise HTTPException(502, f"anthropic network: {e}")


# ───────────────────────── HTTP endpoint ─────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
def chat(
    req: ChatRequest,
    login: str = Depends(current_user),
    x_tenant_slug: str | None = Header(default=None, alias="X-Tenant-Slug"),
    db: Session = Depends(get_session),
):
    api_key = os.getenv("SA_ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(503, "AI not configured: SA_ANTHROPIC_API_KEY missing")
    if not x_tenant_slug:
        raise HTTPException(400, "X-Tenant-Slug header required")
    t = db.query(Tenant).filter(Tenant.slug == x_tenant_slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")

    tools = TOOLS_BY_TEMPLATE.get(t.template_id, [])
    api_tools = [{k: v for k, v in tool.items() if not k.startswith("_")} for tool in tools]
    tool_index = {tool["name"]: tool["_exec"] for tool in tools}

    messages: list[dict] = [
        {"role": m.role, "content": m.content}
        for m in req.messages[-MAX_HISTORY_TURNS:]
    ]

    final_text = ""
    completed = False
    for _ in range(MAX_TOOL_ITERATIONS):
        payload = {
            "model": MODEL,
            "max_tokens": 1024,
            "system": _system_prompt(t),
            "messages": messages,
        }
        if api_tools:
            payload["tools"] = api_tools

        resp = _anthropic_call(api_key, payload)
        blocks = resp.get("content", [])
        stop = resp.get("stop_reason")

        text_parts = [b.get("text", "") for b in blocks if b.get("type") == "text"]
        tool_uses = [b for b in blocks if b.get("type") == "tool_use"]

        if stop != "tool_use" or not tool_uses:
            final_text = "".join(text_parts).strip()
            completed = True
            break

        messages.append({"role": "assistant", "content": blocks})

        tool_results = []
        for tu in tool_uses:
            name = tu.get("name")
            args = tu.get("input") or {}
            tu_id = tu.get("id")
            executor = tool_index.get(name)
            if executor is None:
                result = {"error": f"unknown tool {name}"}
            else:
                try:
                    result = executor(t, login, db, args)
                except Exception as e:
                    result = {"error": f"internal: {e}"}
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tu_id,
                "content": json.dumps(result, ensure_ascii=False),
            })
        messages.append({"role": "user", "content": tool_results})

    if not completed:
        final_text = "(не получилось завершить — слишком много шагов)"

    return {"reply": final_text, "model": MODEL}
