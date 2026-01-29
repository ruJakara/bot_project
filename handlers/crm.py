from __future__ import annotations

import logging
from typing import Any, Dict, Optional, TypedDict

import aiohttp
from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery, 
    InlineKeyboardButton, 
    InlineKeyboardMarkup, 
    Message, 
    KeyboardButton, 
    ReplyKeyboardMarkup, 
    ReplyKeyboardRemove
)

from config import get_settings
from keyboards import main_keyboard

logger = logging.getLogger(__name__)
router = Router(name="crm")
settings = get_settings()

class InvoiceStates(StatesGroup):
    waiting_for_amount = State()

class EnrollStates(StatesGroup):
    waiting_for_city = State()
    waiting_for_phone = State()
    waiting_for_name = State()

class AlfaCrmInvoiceRequest(TypedDict):
    client_id: int
    sum: int
    desc: str

class AlfaCrmMessageRequest(TypedDict):
    client_id: int
    text: str

class AlfaCrmCreateCustomerRequest(TypedDict, total=False):
    name: str
    phone: str
    legal_type: int
    is_study: int
    note: str

def _build_url(path: str) -> str:
    base = settings.alfacrm_domain.rstrip("/")
    if not base.startswith("http"):
        base = f"https://{base}"
    return f"{base.rstrip('/')}/{path.lstrip('/')}"

def _auth_headers() -> Dict[str, str]:
    return {
        "X-ALFACRM-TOKEN": settings.alfacrm_token,
        "Authorization": f"Bearer {settings.alfacrm_token}",
        "Content-Type": "application/json",
    }

async def alfacrm_get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
    url = _build_url(path)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=_auth_headers(), params=params) as resp:
                if resp.status in (401, 403):
                    raise PermissionError("Нет доступа к CRM")
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            logger.error(f"AlfaCRM GET error: {url} {e}")
            raise

async def alfacrm_post(path: str, json_data: Dict[str, Any]) -> Any:
    url = _build_url(path)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, headers=_auth_headers(), json=json_data) as resp:
                if resp.status in (401, 403):
                    raise PermissionError("Нет доступа к CRM")
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            logger.error(f"AlfaCRM POST error: {url} {e}")
            raise

async def get_default_client_id() -> Optional[int]:
    if not settings.default_client_phone:
        return None
    try:
        data = await alfacrm_get("/clients", params={"phone": settings.default_client_phone})
        items = data if isinstance(data, list) else data.get("items") or data.get("data")
        if items:
            return int(items[0].get("id"))
    except Exception:
        pass
    return None

@router.message(Command(commands=["invoice", "счет"]))
async def invoice_command(message: Message) -> None:
    parts = message.text.split(maxsplit=2) if message.text else []
    if len(parts) < 2:
        await message.answer("Укажи сумму: /счет 1000 Описание (по желанию)")
        return
    try:
        amount = int(parts[1])
    except ValueError:
        await message.answer("Сумма должна быть числом.")
        return
    desc = parts[2] if len(parts) == 3 else "Оплата занятий"
    client_id = await get_default_client_id()
    if client_id is None:
        await message.answer("Не удалось найти клиента в AlfaCRM.")
        return
    try:
        response = await alfacrm_post("/invoices", json_data={"client_id": client_id, "sum": amount, "desc": desc})
        link = response.get("link") or response.get("url")
        await message.answer(f"Счет создан. Ссылка для оплаты: {link}" if link else "Счет создан.")
    except Exception:
        await message.answer("Ошибка при создании счета.")

@router.message(F.text == "💰 Счета")
async def list_clients(message: Message) -> None:
    try:
        data = await alfacrm_get("/clients")
        items = data if isinstance(data, list) else data.get("items") or data.get("data") or []
        if not items:
            await message.answer("Клиенты не найдены.")
            return
        buttons = [[InlineKeyboardButton(text=c.get("name", "Без имени"), callback_data=f"client:{c.get('id')}")] for c in items[:10]]
        await message.answer("Выберите клиента:", reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons))
    except Exception:
        await message.answer("Ошибка при получении списка клиентов.")

@router.callback_query(F.data.startswith("client:"))
async def client_selected(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(client_id=callback.data.split(":")[1])
    await state.set_state(InvoiceStates.waiting_for_amount)
    await callback.message.answer("Введите сумму счета:")
    await callback.answer()

@router.message(InvoiceStates.waiting_for_amount)
async def process_invoice_amount(message: Message, state: FSMContext) -> None:
    try:
        amount = int(message.text)
    except ValueError:
        await message.answer("Введите число.")
        return
    data = await state.get_data()
    try:
        response = await alfacrm_post("/invoices", json_data={"client_id": int(data["client_id"]), "sum": amount, "desc": "Оплата через бот"})
        link = response.get("link") or response.get("url")
        await message.answer(f"Счет создан. Ссылка: {link}" if link else "Счет создан.")
        await state.clear()
    except Exception:
        await message.answer("Ошибка при создании счета.")

@router.message(F.text == "📝 Записаться")
async def start_enrollment(message: Message, state: FSMContext) -> None:
    await state.set_state(EnrollStates.waiting_for_city)
    buttons = [
        [KeyboardButton(text="Екатеринбург"), KeyboardButton(text="Среднеуральск")],
        [KeyboardButton(text="Москва"), KeyboardButton(text="Другое")],
        [KeyboardButton(text="🔙 Отмена")]
    ]
    await message.answer("В каком городе вы находитесь?", reply_markup=ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True))

@router.message(EnrollStates.waiting_for_city)
async def process_city(message: Message, state: FSMContext) -> None:
    if message.text == "🔙 Отмена":
        await state.clear()
        await message.answer("Запись отменена.", reply_markup=main_keyboard())
        return
    city = message.text.strip()
    allowed_lower = [c.lower() for c in settings.allowed_cities]
    if city.lower() not in allowed_lower:
        await state.clear()
        await message.answer(f"Мы работаем только в {'/'.join(settings.allowed_cities)}", reply_markup=main_keyboard())
        return
    await state.update_data(city=city)
    await state.set_state(EnrollStates.waiting_for_phone)
    kb = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="📱 Отправить телефон", request_contact=True)], [KeyboardButton(text="🔙 Отмена")]], resize_keyboard=True)
    await message.answer("Отправьте ваш номер телефона:", reply_markup=kb)

@router.message(EnrollStates.waiting_for_phone)
async def process_phone(message: Message, state: FSMContext) -> None:
    if message.text == "🔙 Отмена":
        await state.clear()
        await message.answer("Запись отменена.", reply_markup=main_keyboard())
        return
    if message.contact:
        phone = message.contact.phone_number
    elif message.text:
        phone = message.text.strip()
    else:
        await message.answer("Пожалуйста, отправьте номер телефона.")
        return
    await state.update_data(phone=phone)
    if message.from_user.first_name:
        await finish_enrollment(message, state, phone, message.from_user.full_name or message.from_user.first_name, (await state.get_data()).get("city", ""))
    else:
        await state.set_state(EnrollStates.waiting_for_name)
        await message.answer("Как к вам обращаться?", reply_markup=ReplyKeyboardRemove())

@router.message(EnrollStates.waiting_for_name)
async def process_name(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    await finish_enrollment(message, state, data.get("phone"), message.text.strip(), data.get("city", ""))

async def finish_enrollment(message: Message, state: FSMContext, phone: str, name: str, city: str) -> None:
    branch_id = settings.alfacrm_branch_id
    try:
        search_result = await alfacrm_get(f"/company/{branch_id}/customer/index", params={"phone": phone})
        if search_result.get("items"):
            await message.answer("Вы уже есть в нашей базе!", reply_markup=main_keyboard())
        else:
            await alfacrm_post(f"/v2api/{branch_id}/customer/create", json_data={"name": name, "phone": phone, "legal_type": 1, "is_study": 0, "note": f"Город: {city}"})
            await message.answer("Заявка принята!", reply_markup=main_keyboard())
    except Exception:
        await message.answer("Ошибка при записи.", reply_markup=main_keyboard())
    finally:
        await state.clear()

@router.message(F.text)
async def crm_chat_message(message: Message) -> None:
    if message.text.startswith("/") or message.text in ["🎮 Играть", "💰 Счета", "📝 Записаться", "🏆 Лидерборд"]:
        return
    client_id = await get_default_client_id()
    if client_id:
        try:
            await alfacrm_post("/messages", json_data={"client_id": client_id, "text": message.text})
            await message.answer("Сообщение отправлено.")
        except Exception:
            pass
