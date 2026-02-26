from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiohttp import web

from config import get_settings
from models import init_db
from handlers import games, leads
from handlers.bill import router as bill_router
from handlers.admin_contact import router as admin_contact_router
from handlers.b2b import router as b2b_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def start_web_server() -> web.AppRunner:
    app = web.Application()
    app.router.add_get("/", lambda request: web.Response(text="OK"))
    app.router.add_get("/health", lambda request: web.Response(text="OK"))
    if Path("teGame").is_dir():
        app.router.add_static("/teGame/", path="teGame", show_index=True)
    if Path("games").is_dir():
        app.router.add_static("/games/", path="games", show_index=True)

    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", "10000"))
    site = web.TCPSite(runner, host="0.0.0.0", port=port)
    await site.start()
    logger.info("Web server started on port %s", port)
    return runner


async def main() -> None:
    settings = get_settings()

    # Initialize DB (creates tables if missing)
    await init_db()

    bot = Bot(token=settings.bot_token)
    dp = Dispatcher(storage=MemoryStorage())

    # Register routers — order matters for FSM priority
    dp.include_router(games.router)
    dp.include_router(leads.router)
    dp.include_router(bill_router)
    dp.include_router(admin_contact_router)
    dp.include_router(b2b_router)

    logger.info("Starting bot with polling")
    runner = await start_web_server()
    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
