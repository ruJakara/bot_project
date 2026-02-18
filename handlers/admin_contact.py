from __future__ import annotations

from aiogram import F, Router
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from config import get_settings

router = Router(name="admin_contact")
settings = get_settings()


@router.message(F.text == "📩 Написать админу")
async def write_to_admin(message: Message) -> None:
    username = settings.admin_username.lstrip("@")
    if not username:
        await message.answer("Контакт администратора не настроен. Обратитесь позже.")
        return

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"✉️ Написать @{username}",
                    url=f"https://t.me/{username}",
                )
            ]
        ]
    )
    await message.answer(
        f"Пишите напрямую администратору: @{username}",
        reply_markup=keyboard,
    )
