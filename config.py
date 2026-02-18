import os
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    bot_token: str
    admin_tg_id: int
    admin_username: str
    webapp_base_url: str
    database_url: str
    render_url: str
    webhook_secret: str
    game_paths: dict[str, str]
    # AlfaCRM — optional
    alfacrm_domain: Optional[str] = None
    alfacrm_token: Optional[str] = None
    alfacrm_branch_id: int = 1


def get_settings() -> Settings:
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise RuntimeError("BOT_TOKEN is not set")

    admin_tg_id_str = os.getenv("ADMIN_TG_ID", "0")
    try:
        admin_tg_id = int(admin_tg_id_str)
    except ValueError:
        admin_tg_id = 0

    admin_username = os.getenv("ADMIN_USERNAME", "")

    # Where games are hosted (GitHub Pages or Render)
    webapp_base_url = os.getenv(
        "WEBAPP_BASE_URL",
        os.getenv("RENDER_URL", os.getenv("DOMAIN", "rujakara.github.io/bot_project")),
    )
    # Ensure no trailing slash
    webapp_base_url = webapp_base_url.rstrip("/")

    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./bot.db",
    )

    render_url = webapp_base_url  # alias kept for game URL building

    webhook_secret = os.getenv("WEBHOOK_SECRET", "bot-webhook")

    # AlfaCRM — optional
    alfacrm_domain = os.getenv("ALFACRM_DOMAIN") or None
    alfacrm_token = os.getenv("ALFACRM_TOKEN") or None
    try:
        alfacrm_branch_id = int(os.getenv("ALFACRM_BRANCH_ID", "1"))
    except ValueError:
        alfacrm_branch_id = 1

    # Default game paths mapping
    game_paths = {
        "dasha_tg": "teGame/dasha tg/index.html",
        "hopertg": "teGame/Hopertg/index.html",
        "igra_tg_tamur": "teGame/igra tg tamur/index.htm",
        "kristina": "teGame/kristina/lndex.html",
        "lexa_puzzle": "teGame/lexa_tg_bot_games/головоломка/index.html",
        "lexa_clicker": "teGame/lexa_tg_bot_games/кликер/index.html",
        "rpuk_tg": "teGame/Rpuk.tg/index.html",
        "sapep": "teGame/sapep/index.html",
        "tonya_tg": "teGame/tonyaTG/index.html",
        "hacker_neon": "teGame/ХАКЕР НЕОН/ХАКЕР НЕОН/index.html",
    }

    return Settings(
        bot_token=bot_token,
        admin_tg_id=admin_tg_id,
        admin_username=admin_username,
        webapp_base_url=webapp_base_url,
        database_url=database_url,
        render_url=render_url,
        webhook_secret=webhook_secret,
        game_paths=game_paths,
        alfacrm_domain=alfacrm_domain,
        alfacrm_token=alfacrm_token,
        alfacrm_branch_id=alfacrm_branch_id,
    )
