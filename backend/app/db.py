import os
from pathlib import Path

from sqlalchemy import JSON, Column, ForeignKey, String, UniqueConstraint, create_engine
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

# SQLite нуждается в check_same_thread=False для FastAPI's threadpool
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    login = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)

    kv = relationship("KV", back_populates="user", cascade="all, delete-orphan")


class KV(Base):
    __tablename__ = "kv"
    user_login = Column(String, ForeignKey("users.login", ondelete="CASCADE"), primary_key=True)
    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)

    user = relationship("User", back_populates="kv")
    __table_args__ = (UniqueConstraint("user_login", "key", name="uq_kv_user_key"),)


def init_db() -> None:
    # SQLite — создать каталог под файл.
    if DATABASE_URL.startswith("sqlite:///"):
        Path(DATABASE_URL.replace("sqlite:///", "", 1)).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)


def get_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
