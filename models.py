from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, select
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from config import get_settings
import json
import os
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    games: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scores: Mapped[List["GameScore"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

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

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[str] = mapped_column(String(30))  # UTC ISO string
    tenant_id: Mapped[str] = mapped_column(String(50))
    bot_id: Mapped[str] = mapped_column(String(50))
    tg_id: Mapped[str] = mapped_column(String(30))
    event_name: Mapped[str] = mapped_column(String(100))
    meta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string

class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tg_id: Mapped[int] = mapped_column(Integer, nullable=False)
    tenant_id: Mapped[str] = mapped_column(String(50))
    bot_id: Mapped[str] = mapped_column(String(50))
    enabled: Mapped[bool] = mapped_column(Integer, default=1) # SQLite bool
    mode: Mapped[str] = mapped_column(String(50), default="date")
    next_remind_at: Mapped[str] = mapped_column(String(30)) # ISO string
    created_at: Mapped[str] = mapped_column(String(30))
    updated_at: Mapped[str] = mapped_column(String(30))

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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

            # Check for existing scores to avoid duplicates
            for g in games_list:
                game_id = g.get("game_id")
                score = int(g.get("score", 0))
                duration = int(g.get("duration_sec", 0))
                if not game_id:
                    continue

                # Simple check: if this exact score exists for this user, skip
                score_check = await session.execute(
                    select(GameScore).where(
                        GameScore.user_id == user_id,
                        GameScore.game_id == game_id,
                        GameScore.score == score
                    )
                )
                if not score_check.scalars().first():
                    session.add(GameScore(
                        user_id=user_id,
                        game_id=game_id,
                        score=score,
                        duration_sec=duration,
                    ))

        await session.commit()
    
    # Rename file after migration to avoid re-running
    try:
        os.rename(path, f"{path}.bak")
        logger.info(f"Migration complete. {path} renamed to {path}.bak")
    except Exception as e:
        logger.error(f"Failed to rename {path}: {e}")