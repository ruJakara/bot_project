from __future__ import annotations

import json
import uuid
from typing import Dict, List, TypedDict

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)
from sqlalchemy import desc, select

from config import get_settings
from models import AsyncSessionLocal, GameScore, User


router = Router(name="games")
settings = get_settings()


class GameResultPayload(TypedDict):
    game_id: str
    score: int
    duration_sec: int


def main_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🎮 Играть"), KeyboardButton(text="💰 Счета")],
            [KeyboardButton(text="💬 Чат"), KeyboardButton(text="🏆 Лидерборд")],
        ],
        resize_keyboard=True,
    )


def games_keyboard(games: List[Dict]) -> InlineKeyboardMarkup:
    buttons: List[List[InlineKeyboardButton]] = []
    for game in games:
        if game.get("enabled"):
            buttons.append(
                [
                    InlineKeyboardButton(
                        text=game["name"],
                        callback_data=f"game_{game['id']}",
                    )
                ]
            )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def play_game_keyboard(game_id: str, session_id: str) -> InlineKeyboardMarkup:
    # Маппинг ID игры -> путь к файлу на GitHub Pages
    # Base URL: https://rujakara.github.io/
    game_paths = {
        "dasha_tg": "teGame/dasha tg/index.html",
        "hopertg": "teGame/Hopertg/index.html",
        "igra_tg_tamur": "teGame/igra tg tamur/index.htm",
        "kristina": "teGame/kristina/lndex.html",
        "lexa_puzzle": "teGame/lexa_tg_bot_games/головоломка/index.html",
        "lexa_clicker": "teGame/lexa_tg_bot_games/кликер/index.html",
        "rpuk_tg": "teGame/Rpuk.tg/index.html",
        "sapep": "teGame/sapep/index.html",
        "tonya_tg": "teGame/tonyaTG/index.html",
    }

    # Если игры нет в маппинге, пробуем дефолтный путь (на всякий случай)
    game_path = game_paths.get(game_id, f"teGame/{game_id}/index.html")
    
    # Формируем полный URL
    # https://rujakara.github.io/teGame/Hopertg/index.html?sessionid=...
    url = f"https://{settings.domain}/{game_path}?sessionid={session_id}"
    
    # Кодируем пробелы и спецсимволы, если нужно (браузер обычно справляется, но для надежности можно заменить пробелы)
    # url = url.replace(" ", "%20") 

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎮 Играть",
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )


def load_games() -> List[Dict]:
    with open("games.json", "r", encoding="utf-8") as f:
        return json.load(f)


@router.message(Command("start"))
async def cmd_start(message: Message) -> None:
    await message.answer(
        "👋 Привет! Я бот школы.\n"
        "Выбери действие в меню:",
        reply_markup=main_keyboard(),
    )


@router.message(F.text == "📦 Каталог")
async def show_catalog(message: Message) -> None:
    games = load_games()
    enabled_games = [g for g in games if g.get("enabled")]
    if not enabled_games:
        await message.answer("Пока нет доступных игр.", reply_markup=main_keyboard())
        return

    text_lines = ["📦 Каталог игр:\n"]
    for g in enabled_games:
        name = g.get("name", g.get("id", "Игра"))
        desc = g.get("description", "Без описания")
        text_lines.append(f"🎮 {name}\n   {desc}\n")

    await message.answer("\n".join(text_lines), reply_markup=main_keyboard())


@router.message(F.text == "🎮 Играть")
async def show_games_to_play(message: Message) -> None:
    games = load_games()
    enabled_games = [g for g in games if g.get("enabled")]
    if not enabled_games:
        await message.answer("Пока нет доступных игр.", reply_markup=main_keyboard())
        return

    await message.answer(
        "Выбери игру:",
        reply_markup=games_keyboard(enabled_games),
    )


@router.callback_query(F.data.startswith("game_"))
async def select_game(callback: CallbackQuery) -> None:
    game_id = callback.data.replace("game_", "")
    games = load_games()
    game = next((g for g in games if g["id"] == game_id), None)
    if not game:
        await callback.answer("Игра не найдена")
        return

    session_id = str(uuid.uuid4())
    await callback.message.answer(
        f"🎮 {game['name']}\n\nНажми кнопку ниже, чтобы начать игру.",
        reply_markup=play_game_keyboard(game_id, session_id),
    )
    await callback.answer()


@router.message(F.web_app_data)
async def handle_web_app_data(message: Message) -> None:
    try:
        data: GameResultPayload = json.loads(message.web_app_data.data)
    except Exception:
        await message.answer("Не удалось прочитать результат игры.")
        return

    game_id = data.get("game_id", "unknown")
    score = int(data.get("score", 0))
    duration = int(data.get("duration_sec", 0))

    async with AsyncSessionLocal() as session:
        user = await session.get(User, message.from_user.id)
        if user is None:
            user = User(
                id=message.from_user.id,
                username=message.from_user.username,
                games=None,
            )
            session.add(user)

        score_row = GameScore(
            user_id=message.from_user.id,
            game_id=game_id,
            score=score,
            duration_sec=duration,
        )
        session.add(score_row)
        await session.commit()

    await message.answer(
        f"🏆 Игра завершена!\n\n"
        f"🎮 Игра: {game_id}\n"
        f"⭐ Очки: {score}\n"
        f"⏱ Время: {duration} сек",
        reply_markup=main_keyboard(),
    )


@router.message(Command("leaderboard"))
@router.message(F.text == "🏆 Лидерборд")
async def leaderboard(message: Message) -> None:
    async with AsyncSessionLocal() as session:
        stmt = (
            select(User.username, GameScore.score, GameScore.game_id)
            .join(GameScore, GameScore.user_id == User.id)
            .order_by(desc(GameScore.score))
            .limit(10)
        )
        result = await session.execute(stmt)
        rows = result.all()

    if not rows:
        await message.answer("Лидерборд пока пуст.", reply_markup=main_keyboard())
        return

    text_lines = ["🏆 Лидерборд:"]
    for i, (username, score, game_id) in enumerate(rows, start=1):
        name = username or "Без ника"
        text_lines.append(f"{i}. {name} — {score} ({game_id})")

    await message.answer("\n".join(text_lines), reply_markup=main_keyboard())

