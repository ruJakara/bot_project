from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, select
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Base(AsyncAttrs, DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    first_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Legacy field kept for migration compatibility
    games: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scores: Mapped[List["GameScore"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    game_results: Mapped[List["GameResult"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# Game results (new table, replaces game_scores for new data)
# ---------------------------------------------------------------------------

class GameResult(Base):
    """New table for game results per ТЗ section 11."""
    __tablename__ = "game_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    game_id: Mapped[str] = mapped_column(String(100))
    score: Mapped[int] = mapped_column(Integer, default=0)
    raw_payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user: Mapped[User] = relationship(back_populates="game_results")


# ---------------------------------------------------------------------------
# Legacy GameScore — kept so existing DB rows are not lost
# ---------------------------------------------------------------------------

class GameScore(Base):
    __tablename__ = "game_scores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    game_id: Mapped[str] = mapped_column(String(100))
    score: Mapped[int] = mapped_column(Integer)
    duration_sec: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user: Mapped[User] = relationship(back_populates="scores")


# ---------------------------------------------------------------------------
# Leads — заявки на пробное (ТЗ раздел 7)
# ---------------------------------------------------------------------------

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    child_name: Mapped[str] = mapped_column(String(255), nullable=False)
    child_age: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    interest: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), default="new")


# ---------------------------------------------------------------------------
# Bill requests — "Ожидаю счёт" (ТЗ раздел 8)
# ---------------------------------------------------------------------------

class BillRequest(Base):
    __tablename__ = "bill_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), default="requested")


# ---------------------------------------------------------------------------
# B2B requests — "Хочу такого же бота" (ТЗ раздел 10)
# ---------------------------------------------------------------------------

class B2bRequest(Base):
    __tablename__ = "b2b_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    business_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), default="new")


# ---------------------------------------------------------------------------
# Legacy Event table — kept for existing analytics data
# ---------------------------------------------------------------------------

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[str] = mapped_column(String(30))
    tenant_id: Mapped[str] = mapped_column(String(50))
    bot_id: Mapped[str] = mapped_column(String(50))
    tg_id: Mapped[str] = mapped_column(String(30))
    event_name: Mapped[str] = mapped_column(String(100))
    meta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# ---------------------------------------------------------------------------
# Legacy Reminder table — kept for existing data
# ---------------------------------------------------------------------------

class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_id: Mapped[int] = mapped_column(Integer, nullable=False)
    tenant_id: Mapped[str] = mapped_column(String(50))
    bot_id: Mapped[str] = mapped_column(String(50))
    enabled: Mapped[bool] = mapped_column(Integer, default=1)
    mode: Mapped[str] = mapped_column(String(50), default="date")
    next_remind_at: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[str] = mapped_column(String(30))
    updated_at: Mapped[str] = mapped_column(String(30))


# ---------------------------------------------------------------------------
# DB engine
# ---------------------------------------------------------------------------

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

async def get_or_create_user(tg_user_id: int, username: Optional[str] = None) -> User:
    """Get existing user or create new one, updating last_seen_at."""
    now = datetime.utcnow()
    async with AsyncSessionLocal() as session:
        user = await session.get(User, tg_user_id)
        if user is None:
            user = User(
                id=tg_user_id,
                username=username,
                first_seen_at=now,
                last_seen_at=now,
            )
            session.add(user)
        else:
            user.last_seen_at = now
            if username:
                user.username = username
        await session.commit()
        await session.refresh(user)
        return user


# ---------------------------------------------------------------------------
# Legacy JSON migration
# ---------------------------------------------------------------------------

async def migrate_users_from_json(path: str = "users.json") -> None:
    if not os.path.exists(path):
        return

    try:
        with open(path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load {path}: {e}")
        return

    async with AsyncSessionLocal() as session:
        for user_id_str, user_data in data.items():
            try:
                user_id = int(user_id_str)
            except ValueError:
                continue

            username = user_data.get("username")
            games_list = user_data.get("games") or []

            result = await session.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()

            if user is None:
                user = User(
                    id=user_id,
                    username=username,
                    games=json.dumps(games_list, ensure_ascii=False),
                )
                session.add(user)
            else:
                user.username = username or user.username
                user.games = json.dumps(games_list, ensure_ascii=False)

        await session.commit()

    try:
        os.rename(path, f"{path}.bak")
        logger.info(f"Migration complete. {path} renamed to {path}.bak")
    except Exception as e:
        logger.error(f"Failed to rename {path}: {e}")