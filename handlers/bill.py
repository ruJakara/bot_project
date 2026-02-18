from __future__ import annotations

from aiogram import Bot, F, Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    Contact,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from datetime import datetime

from config import get_settings
from core.notify import notify_admin
from models import AsyncSessionLocal, BillRequest, User, get_or_create_user

router = Router(name="bill")
settings = get_settings()


class BillStates(StatesGroup):
    waiting_for_contact = State()


def _contact_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Отправить номер", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


@router.message(F.text == "💳 Ожидаю счёт")
async def bill_request_start(message: Message, state: FSMContext) -> None:
    user = await get_or_create_user(message.from_user.id, message.from_user.username)

    if not user.phone:
        # Need phone first
        await state.set_state(BillStates.waiting_for_contact)
        await message.answer(
            "Чтобы выставить счёт, нам нужен ваш номер телефона.\n"
            "Нажмите кнопку ниже:",
            reply_markup=_contact_keyboard(),
        )
        return

    await _save_bill_request(message, user.phone, message.bot)


@router.message(BillStates.waiting_for_contact, F.contact)
async def bill_receive_contact(message: Message, state: FSMContext) -> None:
    contact: Contact = message.contact

    # Validate: contact belongs to sender
    if contact.user_id != message.from_user.id:
        await message.answer("Пожалуйста, отправьте свой собственный номер телефона.")
        return

    phone = _normalize_phone(contact.phone_number)

    # Save phone to user
    async with AsyncSessionLocal() as session:
        user = await session.get(User, message.from_user.id)
        if user:
            user.phone = phone
            await session.commit()

    await state.clear()
    await _save_bill_request(message, phone, message.bot)


async def _save_bill_request(message: Message, phone: str, bot: Bot) -> None:
    """Save BillRequest to DB and notify admin."""
    async with AsyncSessionLocal() as session:
        req = BillRequest(
            tg_user_id=message.from_user.id,
            phone=phone,
        )
        session.add(req)
        await session.commit()

    # Reply to user
    from handlers.games import main_keyboard
    await message.answer(
        "✅ Запрос на счёт принят!\n\n"
        "Администратор выставит счёт и напишет вам в личку.",
        reply_markup=main_keyboard(is_known=True),
    )

    # Notify admin
    username = message.from_user.username
    user_link = f"@{username}" if username else f"tg://user?id={message.from_user.id}"
    name = message.from_user.full_name or "—"
    text = (
        "💳 <b>Запрос на счёт</b>\n\n"
        f"👤 Имя: {name}\n"
        f"📱 Телефон: {phone}\n"
        f"🔗 Telegram: {user_link}"
    )
    await notify_admin(bot, text)


def _normalize_phone(phone: str) -> str:
    """Normalize phone number to +7... format."""
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    if not digits.startswith("+"):
        digits = "+" + digits
    return digits
