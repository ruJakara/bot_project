"""Admin notification utility."""
from __future__ import annotations

import logging
import os

from aiogram import Bot

logger = logging.getLogger(__name__)


async def notify_admin(bot: Bot, text: str) -> None:
    """Send a message to the admin's Telegram account.

    Reads ADMIN_TG_ID from env. Safe: catches all exceptions.
    """
    admin_id_str = os.getenv("ADMIN_TG_ID", "0")
    try:
        admin_id = int(admin_id_str)
    except ValueError:
        admin_id = 0

    if not admin_id:
        logger.warning("notify_admin: ADMIN_TG_ID is not set or is 0, skipping notification")
        return

    try:
        await bot.send_message(chat_id=admin_id, text=text)
    except Exception as e:
        logger.warning(f"notify_admin: failed to send message to {admin_id}: {e}")
