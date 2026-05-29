from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import Tenant, TenantKV, get_session
from .auth import current_user

router = APIRouter()


class SetRequest(BaseModel):
    key: str
    value: Any


def tenant_id_from_header(
    x_tenant_slug: str | None = Header(default=None, alias="X-Tenant-Slug"),
    db: Session = Depends(get_session),
) -> int:
    if not x_tenant_slug:
        raise HTTPException(400, "X-Tenant-Slug header required")
    t = db.query(Tenant).filter(Tenant.slug == x_tenant_slug.lower()).first()
    if not t:
        raise HTTPException(404, "tenant not found")
    return t.id


@router.get("/get/{key}")
def get(
    key: str,
    login: str = Depends(current_user),
    tenant_id: int = Depends(tenant_id_from_header),
    db: Session = Depends(get_session),
):
    row = db.get(TenantKV, (tenant_id, login, key))
    if row is None:
        raise HTTPException(404, "key not found")
    return {"key": key, "value": row.value}


@router.post("/set")
def set_value(
    req: SetRequest,
    login: str = Depends(current_user),
    tenant_id: int = Depends(tenant_id_from_header),
    db: Session = Depends(get_session),
):
    row = db.get(TenantKV, (tenant_id, login, req.key))
    if row is None:
        db.add(TenantKV(tenant_id=tenant_id, user_login=login, key=req.key, value=req.value))
    else:
        row.value = req.value
    db.commit()
    return {"ok": True, "key": req.key}


@router.delete("/del/{key}")
def delete(
    key: str,
    login: str = Depends(current_user),
    tenant_id: int = Depends(tenant_id_from_header),
    db: Session = Depends(get_session),
):
    row = db.get(TenantKV, (tenant_id, login, key))
    if row is not None:
        db.delete(row)
        db.commit()
    return {"ok": True, "deleted": row is not None}


@router.get("/keys")
def keys(
    login: str = Depends(current_user),
    tenant_id: int = Depends(tenant_id_from_header),
    db: Session = Depends(get_session),
):
    rows = (
        db.query(TenantKV.key)
        .filter(TenantKV.tenant_id == tenant_id, TenantKV.user_login == login)
        .all()
    )
    return {"keys": [r[0] for r in rows]}
