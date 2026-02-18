from __future__ import annotations

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

from config import get_settings
from core.notify import notify_admin
from models import AsyncSessionLocal, B2bRequest, get_or_create_user

router = Router(name="b2b")
settings = get_settings()


class B2bStates(StatesGroup):
    waiting_for_business_type = State()
    waiting_for_city = State()
    waiting_for_contact = State()
    waiting_for_comment = State()


def _business_type_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🏫 Школа"), KeyboardButton(text="🛒 Магазин")],
            [KeyboardButton(text="🔧 Услуги"), KeyboardButton(text="📦 Другое")],
        ],
        resize_keyboard=True,
    )


_VALID_TYPES = {"🏫 Школа", "🛒 Магазин", "🔧 Услуги", "📦 Другое"}


@router.message(F.text == "👑 Хочу такого же бота")
async def start_b2b(message: Message, state: FSMContext) -> None:
    await state.set_state(B2bStates.waiting_for_business_type)
    await message.answer(
        "👑 Хотите такого же бота для своего бизнеса?\n\n"
        "Выберите тип бизнеса:",
        reply_markup=_business_type_keyboard(),
    )


@router.message(B2bStates.waiting_for_business_type)
async def handle_business_type(message: Message, state: FSMContext) -> None:
    btype = (message.text or "").strip()
    if btype not in _VALID_TYPES:
        await message.answer("Выберите один из вариантов:", reply_markup=_business_type_keyboard())
        return
    await state.update_data(business_type=btype)
    await state.set_state(B2bStates.waiting_for_city)
    await message.answer("В каком городе?", reply_markup=ReplyKeyboardRemove())


@router.message(B2bStates.waiting_for_city)
async def handle_city(message: Message, state: FSMContext) -> None:
    city = (message.text or "").strip()
    if not city:
        await message.answer("Пожалуйста, введите город.")
        return
    await state.update_data(city=city)
    await state.set_state(B2bStates.waiting_for_contact)
    await message.answer("Ваш контакт (телефон или @username):")


@router.message(B2bStates.waiting_for_contact)
async def handle_b2b_contact(message: Message, state: FSMContext) -> None:
    contact = (message.text or "").strip()
    if not contact:
        await message.answer("Пожалуйста, введите контакт.")
        return
    await state.update_data(contact=contact)
    await state.set_state(B2bStates.waiting_for_comment)
    await message.answer("Коротко — что нужно? (1–2 предложения)")


@router.message(B2bStates.waiting_for_comment)
async def handle_b2b_comment(message: Message, state: FSMContext) -> None:
    comment = (message.text or "").strip()
    data = await state.get_data()
    await state.clear()

    business_type = data.get("business_type", "")
    city = data.get("city", "")
    contact = data.get("contact", "")

    # Save to DB
    async with AsyncSessionLocal() as session:
        req = B2bRequest(
            tg_user_id=message.from_user.id,
            business_type=business_type,
            city=city,
            contact=contact,
            comment=comment,
        )
        session.add(req)
        await session.commit()

    # Reply to user
    from handlers.games import main_keyboard
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    await message.answer(
        "✅ Заявка принята!\n\nМы свяжемся с вами для обсуждения проекта. 👑",
        reply_markup=main_keyboard(bool(user.phone)),
    )

    # Notify admin
    username = message.from_user.username
    user_link = f"@{username}" if username else f"tg://user?id={message.from_user.id}"
    full_name = message.from_user.full_name or "—"
    text = (
        "👑 <b>B2B заявка — Хочу такого же бота</b>\n\n"
        f"👤 От: {full_name} ({user_link})\n"
        f"🏢 Бизнес: {business_type}\n"
        f"🌆 Город: {city}\n"
        f"📞 Контакт: {contact}\n"
        f"💬 Описание: {comment}"
    )
    await notify_admin(message.bot, text)
