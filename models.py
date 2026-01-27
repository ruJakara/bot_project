from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, select
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from config import get_settings
import json
import os


settings = get_settings()


class Base(AsyncAttrs, DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    games: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON-строка со списком игр

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
    except Exception:
        return

    async with AsyncSessionLocal() as session:
        for user_id_str, user_data in data.items():
            try:
                user_id = int(user_id_str)
            except ValueError:
                continue

            username = user_data.get("username")
            games_list = user_data.get("games") or []

            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user: Optional[User] = result.scalars().first()

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

            for g in games_list:
                game_id = g.get("game_id")
                score = int(g.get("score", 0))
                duration = int(g.get("duration_sec", 0))
                if not game_id:
                    continue

                score_row = GameScore(
                    user_id=user_id,
                    game_id=game_id,
                    score=score,
                    duration_sec=duration,
                )
                session.add(score_row)

        await session.commit()


