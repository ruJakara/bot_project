from __future__ import annotations

import json
import os
import uuid
from urllib.parse import quote
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
from core.events import track
from core.app_state import get_catalog_items
from core.reminders import enable_reminder, process_due_reminders
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
            [KeyboardButton(text="🎮 Играть")],
            [KeyboardButton(text="🛒 Купить"), KeyboardButton(text="⏰ Напомнить")],
            [KeyboardButton(text="🏆 Лидерборд")],
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


def catalog_keyboard(items: List[Dict]) -> InlineKeyboardMarkup:
    buttons: List[List[InlineKeyboardButton]] = []
    for item in items:
        title = item.get("title")
        item_id = item.get("id")
        if not title or not item_id:
            continue
        buttons.append(
            [
                InlineKeyboardButton(
                    text=title,
                    callback_data=f"catalog_{item_id}",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def play_game_keyboard(game_id: str, session_id: str) -> InlineKeyboardMarkup:
    game_path = settings.game_paths.get(game_id)
    if not game_path:
        url = f"https://{settings.render_url}/"
    else:
        safe_path = quote(game_path, safe="/")
        url = f"https://{settings.render_url}/{safe_path}?gameid={game_id}&sessionid={session_id}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎮 Запустить игру",
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
    await track("user.started", message.from_user.id, {
        "username": message.from_user.username,
        "start_param": message.text.split(maxsplit=1)[1] if len(message.text.split()) > 1 else None,
    })


@router.message(F.text == "📦 Каталог")
async def show_catalog(message: Message) -> None:
    games = load_games()
    await message.answer(
        "Here is the catalog:",
        reply_markup=games_keyboard(games),
    )


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


@router.message(F.text == "🛒 Купить")
async def cmd_buy(message: Message) -> None:
    items = get_catalog_items()
    if items:
        await message.answer(
            "Выберите, как оформить покупку:",
            reply_markup=catalog_keyboard(items),
        )
        return

    # Fallback to legacy behavior if catalog is not configured
    await track("purchase.intent", message.from_user.id, {"source": "menu"})
    await message.answer(
        "Для оформления покупки, пожалуйста, напишите менеджеру: @manager"
    )


@router.callback_query(F.data.startswith("catalog_"))
async def handle_catalog_choice(callback: CallbackQuery) -> None:
    item_id = callback.data.replace("catalog_", "", 1)
    items = get_catalog_items()
    item = next((i for i in items if i.get("id") == item_id), None)
    if not item:
        await callback.answer("Опция недоступна")
        return

    url = item.get("url")
    contact = item.get("contact")

    meta = {
        "source": "menu",
        "product_id": item.get("id"),
    }
    if url:
        meta["url"] = url

    await track("purchase.intent", callback.from_user.id, meta)

    cta_text = item.get("cta_text") or "Оформление покупки"
    if url:
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Открыть ссылку",
                        url=url,
                    )
                ]
            ]
        )
        await callback.message.answer(cta_text, reply_markup=keyboard)
    elif contact:
        await callback.message.answer(f"{cta_text}\n\nКонтакт: {contact}")
    else:
        await callback.message.answer(cta_text)

    await callback.answer()


@router.message(F.text == "⏰ Напомнить")
async def cmd_remind(message: Message) -> None:
    # Set reminder for 6 months (default)
    # NOTE: track("reminder.enabled") is called inside enable_reminder()
    await enable_reminder(message.from_user.id, months=6)
    await message.answer(
        "⏰ Ок, я напомню вам через 6 месяцев.\n"
        "Мы пришлем уведомление, когда придет время."
    )


@router.message(Command("send_due_reminders"))
async def cmd_send_due_reminders(message: Message) -> None:
    """Manual trigger to process due reminders."""
    admin_id = int(os.getenv("ADMIN_TG_ID", "0"))
    if admin_id != 0 and message.from_user.id != admin_id:
        await message.answer("Недоступно.")
        return

    count = await process_due_reminders()
    await message.answer(f"✅ Обработано напоминаний: {count}")


@router.callback_query(F.data.startswith("game_"))
async def select_game(callback: CallbackQuery) -> None:
    game_id = callback.data.replace("game_", "")
    games = load_games()
    game = next((g for g in games if g["id"] == game_id), None)
    if not game:
        await callback.answer("Игра не найдена")
        return
    if game_id not in settings.game_paths:
        await callback.answer("Путь к игре не настроен")
        return

    session_id = str(uuid.uuid4())
    await callback.message.answer(
        f"🎮 {game['name']}\n\nНажми кнопку ниже, чтобы начать игру.",
        reply_markup=play_game_keyboard(game_id, session_id),
    )
    await track("game.opened", callback.from_user.id, {
        "game_id": game_id,
        "session_id": session_id,
        "source": "menu",
    })
    await callback.answer()


@router.message(F.web_app_data)
async def handle_web_app_data(message: Message) -> None:
    try:
        data: GameResultPayload = json.loads(message.web_app_data.data)
        # We track "game.finished" immediately after successful parse
        await track("game.finished", message.from_user.id, {
            "game_id": data.get("game_id", "unknown"),
            "score": data.get("score"),
            "duration_sec": data.get("duration_sec"),
            "raw_payload": message.web_app_data.data,
        })
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

