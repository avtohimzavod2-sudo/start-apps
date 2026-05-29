from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .sockets import storage, auth, tenants, ai, bookings

app = FastAPI(
    title="Start-Apps Backend",
    version="1.0.0",
    description="Розетки sa.storage и sa.auth для мини-приложений",
)


@app.on_event("startup")
def _startup() -> None:
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(storage.router, prefix="/sa/storage", tags=["sa.storage"])
app.include_router(auth.router, prefix="/sa/auth", tags=["sa.auth"])
app.include_router(tenants.router, prefix="/sa/tenants", tags=["sa.tenants"])
app.include_router(ai.router, prefix="/sa/ai", tags=["sa.ai"])
# bookings монтируется под /sa/tenants чтобы slug был в path
app.include_router(bookings.router, prefix="/sa/tenants", tags=["sa.bookings"])


@app.get("/health")
def health():
    return {"status": "ok", "contract": "v1"}
