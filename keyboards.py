from typing import Dict, List

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)


def main_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📦 Каталог"), KeyboardButton(text="🎮 Играть")],
            [KeyboardButton(text="💰 Счета"), KeyboardButton(text="💬 Чат с школой")],
            [KeyboardButton(text="📝 Записаться"), KeyboardButton(text="🏆 Лидерборд")],
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


def play_game_keyboard(url: str) -> InlineKeyboardMarkup:
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
