import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

# По умолчанию — SQLite-файл рядом с backend. Через DATABASE_URL переключается
# на любой движок поддерживаемый SQLAlchemy (Postgres через postgresql+psycopg://...).
_DEFAULT = f"sqlite:///{Path(__file__).resolve().parent.parent / 'data' / 'app.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT)

# Render/Heroku отдают postgres://, SQLAlchemy 2.x хочет явный диалект.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://") and "+" not in DATABASE_URL.split("://", 1)[0]:
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    login = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    owner_login = Column(String, ForeignKey("users.login", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Storage attached to (tenant, конкретный пользователь, key).
# Каждый клиент бизнеса видит только свои данные внутри tenant'а.
class TenantKV(Base):
    __tablename__ = "tenant_kv"
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    user_login = Column(String, ForeignKey("users.login", ondelete="CASCADE"), primary_key=True)
    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
    __table_args__ = (UniqueConstraint("tenant_id", "user_login", "key", name="uq_tkv"),)


def init_db() -> None:
    if DATABASE_URL.startswith("sqlite:///"):
        Path(DATABASE_URL.replace("sqlite:///", "", 1)).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)


def get_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
