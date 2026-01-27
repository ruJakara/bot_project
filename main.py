from __future__ import annotations

import asyncio
import logging
import os

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

from config import get_settings
from handlers import crm, games
from models import init_db, migrate_users_from_json


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


settings = get_settings()
bot = Bot(token=settings.bot_token, parse_mode="HTML")
dp = Dispatcher()
dp.include_router(games.router)
dp.include_router(crm.router)


async def on_startup() -> None:
    await init_db()
    await migrate_users_from_json()

    if settings.render_url:
        webhook_path = f"/{settings.webhook_secret}"
        webhook_url = f"https://{settings.render_url}{webhook_path}"
        await bot.set_webhook(webhook_url)
        logger.info("Webhook set to %s", webhook_url)
    else:
        logger.warning("RENDER_URL is not set, webhook will not be configured.")


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
    except Exception:
        logger.exception("Webhook error")
        return web.json_response({"status": "error"}, status=500)


def create_app() -> web.Application:
    app = web.Application()
    webhook_path = f"/{settings.webhook_secret}"

    app.router.add_post('/crm-webhook', crm_webhook)

    SimpleRequestHandler(dp, bot).register(app, path=webhook_path)
    setup_application(app, dp, bot=bot)

    app.on_startup.append(lambda _: asyncio.create_task(on_startup()))
    app.on_shutdown.append(lambda _: asyncio.create_task(on_shutdown()))

    return app


def main() -> None:
    app = create_app()
    port = int(os.getenv("PORT", 8080))
    web.run_app(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()

