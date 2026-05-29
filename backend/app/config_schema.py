"""Нормализация и валидация tenant.config для блок-системы.

Один рантайм — много конфигов. Все клиентские config-ы приводятся к единой схеме:

  {
    "business": {name, address, phone, color, emoji, master_name?},
    "data":     {services: [...], schedule: {mon_sat, sun, slot_min, raw?}},
    "blocks":   [{id, type, settings}]
  }

Старые тенанты с конфигом в плоском формате (master_name/services/schedule в корне)
поднимаются нормализатором лениво — на каждое чтение и в каждой записи. Идемпотентно.
"""
from __future__ import annotations

from typing import Any

ALLOWED_BLOCK_TYPES = {
    "services", "booking", "ai_assistant", "contacts", "owner_panel",
}

# Зависимости блока: какие data-поля обязаны быть заполнены, чтобы блок не был сломан.
BLOCK_REQUIRES_DATA: dict[str, list[str]] = {
    "booking": ["services", "schedule"],
    "services": ["services"],
}

DEFAULT_SETTINGS: dict[str, dict] = {
    "services":     {"title": "Наши услуги"},
    "booking":      {"days_ahead": 7},
    "ai_assistant": {"greeting": "Привет! Помогу записаться или ответить на вопросы."},
    "contacts":     {},
    "owner_panel":  {},
}

PRESETS: dict[str, list[dict]] = {
    "barbershop": [
        {"id": "b_services", "type": "services",     "settings": dict(DEFAULT_SETTINGS["services"])},
        {"id": "b_booking",  "type": "booking",      "settings": dict(DEFAULT_SETTINGS["booking"])},
        {"id": "b_ai",       "type": "ai_assistant", "settings": dict(DEFAULT_SETTINGS["ai_assistant"])},
        {"id": "b_owner",    "type": "owner_panel",  "settings": dict(DEFAULT_SETTINGS["owner_panel"])},
        {"id": "b_contacts", "type": "contacts",     "settings": dict(DEFAULT_SETTINGS["contacts"])},
    ],
}


def preset_for(template_id: str) -> list[dict]:
    """Дефолтный набор блоков для пресета. Неизвестный template_id → barbershop."""
    return [dict(b, settings=dict(b["settings"])) for b in PRESETS.get(template_id, PRESETS["barbershop"])]


def _hydrate_business(c: dict, name: str, color: str, emoji: str) -> dict:
    business = c.get("business") if isinstance(c.get("business"), dict) else {}
    business = dict(business)
    business.setdefault("name", name)
    business.setdefault("color", color)
    business.setdefault("emoji", emoji)
    business.setdefault("address", c.get("address", "") or "")
    business.setdefault("phone", "")
    # legacy
    if c.get("master_name") and "master_name" not in business:
        business["master_name"] = c["master_name"]
    return business


def _hydrate_data(c: dict) -> dict:
    data = c.get("data") if isinstance(c.get("data"), dict) else {}
    data = dict(data)

    if "services" not in data:
        data["services"] = c.get("services") if isinstance(c.get("services"), list) else []

    if "schedule" not in data:
        legacy = c.get("schedule")
        if isinstance(legacy, str):
            data["schedule"] = {
                "mon_sat": _extract_hours(legacy) or "10:00-20:00",
                "sun": "closed",
                "slot_min": 30,
                "raw": legacy,
            }
        else:
            data["schedule"] = {"mon_sat": "10:00-20:00", "sun": "closed", "slot_min": 30}
    else:
        sch = data["schedule"] if isinstance(data["schedule"], dict) else {}
        sch.setdefault("mon_sat", "10:00-20:00")
        sch.setdefault("sun", "closed")
        sch.setdefault("slot_min", 30)
        data["schedule"] = sch

    return data


def _extract_hours(s: str) -> str | None:
    import re
    m = re.search(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", s)
    return f"{m.group(1)}-{m.group(2)}" if m else None


def normalize(config: Any, template_id: str, name: str, color: str, emoji: str) -> dict:
    """Привести любой config к {business, data, blocks}. Идемпотентно."""
    c = config if isinstance(config, dict) else {}
    business = _hydrate_business(c, name, color, emoji)
    data = _hydrate_data(c)

    blocks = c.get("blocks")
    if not isinstance(blocks, list) or not blocks:
        blocks = preset_for(template_id)
    else:
        blocks = [_normalize_block(b) for b in blocks if isinstance(b, dict)]

    return {"business": business, "data": data, "blocks": blocks}


def _normalize_block(b: dict) -> dict:
    btype = b.get("type")
    settings = b.get("settings") if isinstance(b.get("settings"), dict) else {}
    return {
        "id": b.get("id") or f"b_{btype}_{id(b)}",
        "type": btype,
        "settings": {**DEFAULT_SETTINGS.get(btype, {}), **settings},
    }


class ConfigError(ValueError):
    pass


def validate(config: dict) -> None:
    """Кидает ConfigError с понятным сообщением если что-то не так."""
    if not isinstance(config, dict):
        raise ConfigError("config должен быть объектом")
    blocks = config.get("blocks") or []
    if not isinstance(blocks, list):
        raise ConfigError("blocks должен быть массивом")
    seen_ids: set[str] = set()
    for b in blocks:
        if not isinstance(b, dict):
            raise ConfigError("каждый блок — это объект")
        bid = b.get("id")
        btype = b.get("type")
        if not bid:
            raise ConfigError("у блока должен быть id")
        if bid in seen_ids:
            raise ConfigError(f"дублируется id блока: {bid}")
        seen_ids.add(bid)
        if btype not in ALLOWED_BLOCK_TYPES:
            raise ConfigError(f"неизвестный тип блока: {btype}")

    data = config.get("data") or {}
    for b in blocks:
        for req in BLOCK_REQUIRES_DATA.get(b["type"], []):
            val = data.get(req)
            if not val:
                raise ConfigError(f"блок «{b['type']}» требует data.{req} (заполни в редакторе данных)")
            if req == "services" and isinstance(val, list):
                for s in val:
                    if not isinstance(s, dict) or not s.get("name") or s.get("price") in (None, ""):
                        raise ConfigError("в услугах нужно имя и цена у каждой строки")


def normalize_and_validate(config: Any, template_id: str, name: str, color: str, emoji: str) -> dict:
    """Удобная связка для записи: нормализовать, потом валидировать. Поднимает ConfigError."""
    norm = normalize(config, template_id, name, color, emoji)
    validate(norm)
    return norm
