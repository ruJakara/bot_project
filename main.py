from __future__ import annotations

import asyncio
import logging
import os

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
# Note: For production, Redis is better, but for a simple bot, we can use aiosqlite or just stick to Memory if persistence isn't critical.
# However, the user wants it "easy to configure". Let's keep Memory for now but add a comment about Redis.
# Or better, use a simple JSON or SQLite storage if available.
# Aiogram 3 has aiosqlite storage but it requires an extra package.
# Let's stick to MemoryStorage for simplicity but ensure the bot is robust.

from config import get_settings
import crm
from handlers import games
from handlers.leads import router as leads_router
from models import init_db, migrate_users_from_json

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()
bot = Bot(token=settings.bot_token)
dp = Dispatcher(storage=MemoryStorage())

dp.include_router(games.router)
dp.include_router(crm.router)
dp.include_router(leads_router)

async def on_startup() -> None:
    await init_db()
    await migrate_users_from_json()

    if settings.render_url:
        webhook_path = f"/{settings.webhook_secret}"
        webhook_url = f"https://{settings.render_url}{webhook_path}"
        await bot.set_webhook(webhook_url)
        logger.info(f"Webhook set to {webhook_url}")
    else:
        logger.warning("RENDER_URL is not set, bot will not use webhooks for Telegram.")

async def on_shutdown() -> None:
    await bot.session.close()

async def crm_webhook(request: web.Request) -> web.Response:
    try:
        data = await request.json()
        chat_id = data.get('chat_id')
        text = data.get('text')
        if chat_id and text:
            await bot.send_message(chat_id, text)
        return web.json_response({"status": "ok"})
    except Exception as e:
        logger.error(f"CRM Webhook error: {e}")
        return web.json_response({"status": "error"}, status=500)

def create_app() -> web.Application:
    app = web.Application()
    
    # Register CRM webhook
    app.router.add_post('/crm-webhook', crm_webhook)

    # Register Telegram webhook if secret is set
    from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
    webhook_path = f"/{settings.webhook_secret}"
    SimpleRequestHandler(dp, bot).register(app, path=webhook_path)
    setup_application(app, dp, bot=bot)

    # Add startup/shutdown tasks
    app.on_startup.append(lambda _: asyncio.create_task(on_startup()))
    app.on_shutdown.append(lambda _: asyncio.create_task(on_shutdown()))

    return app

def main() -> None:
    app = create_app()
    port = int(os.getenv("PORT", 8080))
    logger.info(f"Starting bot on port {port}")
    web.run_app(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
