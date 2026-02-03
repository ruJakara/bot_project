import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

from config import get_settings
from handlers.games import router as games_router
from handlers.leads import router as leads_router

logging.basicConfig(level=logging.INFO)

async def main():
    settings = get_settings()

    bot = Bot(
        token=settings.bot_token,
        parse_mode=ParseMode.HTML,
    )

    dp = Dispatcher()

    # Подключаем роутеры
    dp.include_router(games_router)
    dp.include_router(leads_router)

    # Запуск polling
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
