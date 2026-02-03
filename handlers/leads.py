from __future__ import annotations

from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup

import crm
from config import get_settings

try:
    from keyboards import main_keyboard  # type: ignore
except Exception:
    def main_keyboard() -> ReplyKeyboardMarkup:
        return ReplyKeyboardMarkup(
            keyboard=[[KeyboardButton(text="📝 Запись")]],
            resize_keyboard=True,
        )


router = Router(name="leads")
settings = get_settings()


class LeadStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_phone = State()


def _entry_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📝 Запись")]],
        resize_keyboard=True,
    )


@router.message(lambda msg: msg.text == "📝 Запись")
async def start_lead(message: Message, state: FSMContext) -> None:
    await state.set_state(LeadStates.waiting_for_name)
    await message.answer("Как вас зовут?", reply_markup=_entry_keyboard())


@router.message(LeadStates.waiting_for_name)
async def handle_name(message: Message, state: FSMContext) -> None:
    name = (message.text or "").strip()
    if not name:
        await message.answer("Пожалуйста, введите имя.")
        return
    await state.update_data(name=name)
    await state.set_state(LeadStates.waiting_for_phone)
    await message.answer("Введите номер телефона:")


@router.message(LeadStates.waiting_for_phone)
async def handle_phone(message: Message, state: FSMContext) -> None:
    phone = (message.text or "").strip()
    if not phone:
        await message.answer("Пожалуйста, введите номер телефона.")
        return
    data = await state.get_data()
    name = data.get("name", "")

    crm.create_lead(
        branch_id=settings.alfacrm_branch_id,
        name=name,
        phone=phone,
        note="Заявка из Telegram",
    )

    await state.clear()
    await message.answer(
        "✅ Заявка принята! Мы свяжемся с вами в ближайшее время.",
        reply_markup=main_keyboard(),
    )
