from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiohttp import web

from config import get_settings
from handlers import games
from handlers.leads import router as leads_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start_web_server() -> web.AppRunner:
    app = web.Application()
    app.router.add_get("/", lambda request: web.Response(text="OK"))
    app.router.add_get("/health", lambda request: web.Response(text="OK"))
    if Path("teGame").is_dir():
        app.router.add_static("/teGame/", path="teGame", show_index=True)

    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", "10000"))
    site = web.TCPSite(runner, host="0.0.0.0", port=port)
    await site.start()
    logger.info("Web server started on port %s", port)
    return runner


async def main() -> None:
    settings = get_settings()
    bot = Bot(token=settings.bot_token)
    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(games.router)
    dp.include_router(leads_router)

    logger.info("Starting bot with polling")
    runner = await start_web_server()
    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
