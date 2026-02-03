from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from config import get_settings
from handlers import games
from handlers.leads import router as leads_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main() -> None:
    settings = get_settings()
    bot = Bot(token=settings.bot_token)
    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(games.router)
    dp.include_router(leads_router)

    logger.info("Starting bot with polling")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
