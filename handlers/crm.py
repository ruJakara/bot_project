from __future__ import annotations

import logging
from typing import Any, Dict, Optional, TypedDict

import aiohttp
from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from config import get_settings


logger = logging.getLogger(__name__)
router = Router(name="crm")
settings = get_settings()


class InvoiceStates(StatesGroup):
    waiting_for_amount = State()


class AlfaCrmClient(TypedDict):
    id: int
    name: str
    phone: str


class AlfaCrmInvoiceRequest(TypedDict):
    client_id: int
    sum: int
    desc: str


class AlfaCrmMessageRequest(TypedDict):
    client_id: int
    text: str


def _build_url(path: str) -> str:
    base = settings.alfacrm_domain.rstrip("/")
    if not base.startswith("http"):
        base = f"https://{base}"
    return f"{base.rstrip('/')}/{path.lstrip('/')}"


def _auth_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.alfacrm_token}",
        "Content-Type": "application/json",
    }


async def alfacrm_get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
    url = _build_url(path)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=_auth_headers(), params=params) as resp:
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            logger.exception("AlfaCRM GET error: %s %s", url, e)
            raise


async def alfacrm_post(path: str, json_data: Dict[str, Any]) -> Any:
    url = _build_url(path)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, headers=_auth_headers(), json=json_data) as resp:
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            logger.exception("AlfaCRM POST error: %s %s", url, e)
            raise


async def get_default_client_id() -> Optional[int]:
    if not settings.default_client_phone:
        logger.warning("ALFACRM_DEFAULT_PHONE is not set")
        return None

    try:
        data = await alfacrm_get(
            "/clients",
            params={"phone": settings.default_client_phone},
        )
    except Exception:
        return None

    items = data if isinstance(data, list) else data.get("items") or data.get("data")
    if not items:
        return None

    first = items[0]
    return int(first.get("id"))


@router.message(Command(commands=["invoice", "счет"]))
async def invoice_command(message: Message) -> None:
    """
    /invoice 1000 описание
    /счет 1000
    """
    parts = message.text.split(maxsplit=2) if message.text else []
    if len(parts) < 2:
        await message.answer("Укажи сумму: /счет 1000 Описание (по желанию)")
        return

    try:
        amount = int(parts[1])
    except ValueError:
        await message.answer("Сумма должна быть числом. Пример: /счет 1000 Оплата занятий")
        return

    desc = parts[2] if len(parts) == 3 else "Оплата занятий"

    client_id = await get_default_client_id()
    if client_id is None:
        await message.answer("Не удалось найти клиента в AlfaCRM. Проверь телефон в ALFACRM_DEFAULT_PHONE.")
        return

    payload: AlfaCrmInvoiceRequest = {
        "client_id": client_id,
        "sum": amount,
        "desc": desc,
    }

    try:
        response = await alfacrm_post("/invoices", json_data=payload)
    except Exception:
        await message.answer("Не удалось создать счет в AlfaCRM.")
        return

    invoice_id = response.get("id") or response.get("invoice_id")
    link = response.get("link") or response.get("url")

    text = "Счет создан."
    if invoice_id:
        text += f"\nID: {invoice_id}"
    if link:
        text += f"\nСсылка для оплаты: {link}"

    await message.answer(text)


@router.message(Command("clients"))
@router.message(F.text == "💰 Счета")
async def list_clients(message: Message) -> None:
    try:
        data = await alfacrm_get("/clients")
        items = data if isinstance(data, list) else data.get("items") or data.get("data") or []
        
        if not items:
            await message.answer("Клиенты не найдены.")
            return

        buttons = []
        for client in items:
            c_id = client.get("id")
            name = client.get("name", "Без имени")
            buttons.append([InlineKeyboardButton(text=name, callback_data=f"client:{c_id}")])
        
        # Limit to 10
        buttons = buttons[:10]
        
        await message.answer("Выберите клиента для выставления счета:", reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons))
    except Exception:
        logger.exception("Error listing clients")
        await message.answer("Ошибка при получении списка клиентов.")


@router.callback_query(F.data.startswith("client:"))
async def client_selected(callback: CallbackQuery, state: FSMContext) -> None:
    client_id = callback.data.split(":")[1]
    await state.update_data(client_id=client_id)
    await state.set_state(InvoiceStates.waiting_for_amount)
    await callback.message.answer("Введите сумму счета:")
    await callback.answer()


@router.message(InvoiceStates.waiting_for_amount)
async def process_invoice_amount(message: Message, state: FSMContext) -> None:
    try:
        amount = int(message.text)
    except ValueError:
        await message.answer("Пожалуйста, введите число.")
        return

    data = await state.get_data()
    client_id = int(data["client_id"])
    
    payload: AlfaCrmInvoiceRequest = {
        "client_id": client_id,
        "sum": amount,
        "desc": "Оплата через бот",
    }
    
    try:
        response = await alfacrm_post("/invoices", json_data=payload)
        invoice_id = response.get("id") or response.get("invoice_id")
        link = response.get("link") or response.get("url")
        
        text = f"Счет #{invoice_id} на {amount} руб. создан."
        if link:
            text += f"\nСсылка: {link}"
            
        await message.answer(text)
        await state.clear()
    except Exception:
        logger.exception("Error creating invoice")
        await message.answer("Не удалось создать счет в AlfaCRM.")


@router.message(F.text & ~Command(commands=["start", "invoice", "счет"]))
async def crm_chat_message(message: Message) -> None:
    """
    Любое текстовое сообщение пересылаем в чат клиента AlfaCRM.
    Используется клиент из ALFACRM_DEFAULT_PHONE.
    """
    client_id = await get_default_client_id()
    if client_id is None:
        await message.answer("Не найден клиент в AlfaCRM, сообщение не отправлено.")
        return

    payload: AlfaCrmMessageRequest = {
        "client_id": client_id,
        "text": message.text or "",
    }

    try:
        await alfacrm_post("/messages", json_data=payload)
    except Exception:
        await message.answer("Не удалось отправить сообщение в AlfaCRM.")
        return

    await message.answer("Сообщение отправлено в школу.")

