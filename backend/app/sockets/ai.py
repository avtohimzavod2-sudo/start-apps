"""Розетка sa.ai — прокси к Anthropic API.
Шаблон шлёт диалог, бэк подмешивает системный промпт из tenant.config,
вызывает claude-sonnet-4-6 и возвращает ответ ассистента.
Ключ Anthropic берётся из env SA_ANTHROPIC_API_KEY (sync:false в render.yaml).
"""
import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import Tenant, get_session
from .auth import current_user

router = APIRouter()

MODEL = "claude-sonnet-4-6"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MAX_TURNS = 30  # отрезаем хвост, чтобы не разносило контекст


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _system_prompt(t: Tenant) -> str:
    cfg = t.config or {}
    if t.template_id == "barbershop":
        services = cfg.get("services", [])
        services_txt = "\n".join(
            f"  - {s.get('name', '?')}: {s.get('price', '?')} сом, ~{s.get('duration', '?')} мин"
            for s in services
        ) or "  (не указаны)"
        return (
            f"Ты — AI-ассистент барбершопа «{t.name}» в Бишкеке. "
            f"Отвечай ТОЛЬКО про этот барбершоп, его услуги, цены, график и запись. "
            f"Если спрашивают про что-то постороннее — вежливо вернись к теме барбершопа.\n\n"
            f"Мастер: {cfg.get('master_name', '—')}\n"
            f"Услуги:\n{services_txt}\n"
            f"График: {cfg.get('schedule', '—')}\n"
            f"Адрес: {cfg.get('address', '—')}\n\n"
            f"Отвечай по-русски, кратко (1-3 предложения), дружелюбно. "
            f"Если клиент пишет по-кыргызски — переключайся на кыргызский. "
            f"Цены — в сомах. Если клиент хочет записаться — спроси услугу, дату и время, "
            f"подтверди детали."
        )
    return f"Ты — AI-ассистент бизнеса «{t.name}». Отвечай кратко и по делу."


@router.post("/chat")
def chat(
    req: ChatRequest,
    _: str = Depends(current_user),
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

    msgs = [{"role": m.role, "content": m.content} for m in req.messages[-MAX_TURNS:]]
    payload = {
        "model": MODEL,
        "max_tokens": 512,
        "system": _system_prompt(t),
        "messages": msgs,
    }
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        ANTHROPIC_URL,
        data=body,
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")[:500]
        raise HTTPException(502, f"anthropic {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise HTTPException(502, f"anthropic network: {e}")

    text = ""
    for block in data.get("content", []):
        if block.get("type") == "text":
            text += block.get("text", "")
    return {"reply": text, "model": MODEL}
