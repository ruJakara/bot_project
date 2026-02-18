from __future__ import annotations

from aiogram import Bot, F, Router
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
from models import AsyncSessionLocal, Lead, get_or_create_user

router = Router(name="leads")
settings = get_settings()


class LeadStates(StatesGroup):
    waiting_for_child_name = State()
    waiting_for_child_age = State()
    waiting_for_interest = State()
    waiting_for_comment = State()


def _interest_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="💻 Программирование"), KeyboardButton(text="🤖 Робототехника")],
            [KeyboardButton(text="🎮 Игры"), KeyboardButton(text="🤷 Не знаю")],
        ],
        resize_keyboard=True,
    )


def _skip_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="⏭ Пропустить")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


@router.message(F.text == "📝 Записаться / пробное")
async def start_lead(message: Message, state: FSMContext) -> None:
    await state.set_state(LeadStates.waiting_for_child_name)
    await message.answer(
        "📝 Запись на пробное занятие\n\nКак зовут ребёнка?",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(LeadStates.waiting_for_child_name)
async def handle_child_name(message: Message, state: FSMContext) -> None:
    name = (message.text or "").strip()
    if not name:
        await message.answer("Пожалуйста, введите имя ребёнка.")
        return
    await state.update_data(child_name=name)
    await state.set_state(LeadStates.waiting_for_child_age)
    await message.answer("Сколько лет ребёнку?")


@router.message(LeadStates.waiting_for_child_age)
async def handle_child_age(message: Message, state: FSMContext) -> None:
    age = (message.text or "").strip()
    if not age.isdigit():
        await message.answer("Пожалуйста, введите возраст цифрой (например: 10).")
        return
    await state.update_data(child_age=age)
    await state.set_state(LeadStates.waiting_for_interest)
    await message.answer(
        "Что интересует?",
        reply_markup=_interest_keyboard(),
    )


_VALID_INTERESTS = {"💻 Программирование", "🤖 Робототехника", "🎮 Игры", "🤷 Не знаю"}


@router.message(LeadStates.waiting_for_interest)
async def handle_interest(message: Message, state: FSMContext) -> None:
    interest = (message.text or "").strip()
    if interest not in _VALID_INTERESTS:
        await message.answer("Выберите один из вариантов:", reply_markup=_interest_keyboard())
        return
    await state.update_data(interest=interest)
    await state.set_state(LeadStates.waiting_for_comment)
    await message.answer(
        "Есть что добавить? (или нажмите «Пропустить»)",
        reply_markup=_skip_keyboard(),
    )


@router.message(LeadStates.waiting_for_comment)
async def handle_comment(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    comment = None if text == "⏭ Пропустить" else text

    data = await state.get_data()
    await state.clear()

    child_name = data.get("child_name", "")
    child_age = data.get("child_age", "")
    interest = data.get("interest", "")

    # Save to DB
    async with AsyncSessionLocal() as session:
        lead = Lead(
            tg_user_id=message.from_user.id,
            child_name=child_name,
            child_age=child_age,
            interest=interest,
            comment=comment,
        )
        session.add(lead)
        await session.commit()

    # Reply to user
    from handlers.games import main_keyboard
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    await message.answer(
        "✅ Заявка принята!\n\nМы свяжемся с вами в ближайшее время.",
        reply_markup=main_keyboard(bool(user.phone)),
    )

    # Notify admin
    username = message.from_user.username
    user_link = f"@{username}" if username else f"tg://user?id={message.from_user.id}"
    full_name = message.from_user.full_name or "—"
    text_parts = [
        "📝 <b>Новая заявка на пробное</b>\n",
        f"👤 Родитель: {full_name} ({user_link})",
        f"👶 Ребёнок: {child_name}, {child_age} лет",
        f"🎯 Интерес: {interest}",
    ]
    if comment:
        text_parts.append(f"💬 Комментарий: {comment}")
    await notify_admin(message.bot, "\n".join(text_parts))
