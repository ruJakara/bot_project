import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass
class Settings:
    bot_token: str
    alfacrm_domain: str
    alfacrm_token: str
    database_url: str
    render_url: str | None
    webhook_secret: str
    default_client_phone: str | None
    alfacrm_branch_id: int
    allowed_cities: list[str]
    domain: str = "rujakara.github.io/bot_project/"
    game_path: str = "telegram-GamesteGameIndex.html"


def get_settings() -> Settings:
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise RuntimeError("BOT_TOKEN is not set")

    alfacrm_domain = os.getenv("ALFACRM_DOMAIN", "")
    alfacrm_token = os.getenv("ALFACRM_TOKEN", "")
    if not alfacrm_domain or not alfacrm_token:
        raise RuntimeError("ALFACRM_DOMAIN or ALFACRM_TOKEN is not set")

    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./bot.db",
    )

    render_url = os.getenv("RENDER_URL")
    webhook_secret = os.getenv("WEBHOOK_SECRET", "bot-webhook")
    default_client_phone = os.getenv("ALFACRM_DEFAULT_PHONE")
    
    try:
        alfacrm_branch_id = int(os.getenv("ALFACRM_BRANCH_ID", "1"))
    except ValueError:
        alfacrm_branch_id = 1

    allowed_cities_str = os.getenv("ALLOWED_CITIES", "Екатеринбург,Среднеуральск")
    allowed_cities = [city.strip() for city in allowed_cities_str.split(",") if city.strip()]

    return Settings(
        bot_token=bot_token,
        alfacrm_domain=alfacrm_domain,
        alfacrm_token=alfacrm_token,
        database_url=database_url,
        render_url=render_url,
        webhook_secret=webhook_secret,
        default_client_phone=default_client_phone,
        alfacrm_branch_id=alfacrm_branch_id,
        allowed_cities=allowed_cities,
    )

