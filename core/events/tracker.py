from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from models import AsyncSessionLocal, Event

logger = logging.getLogger(__name__)

_BOT_ID = os.getenv("BOT_ID", "tsar_bot")
_TENANT_ID = os.getenv("TENANT_ID", "myking")


async def track(event_name: str, tg_id: int, meta: dict | None = None) -> None:
    """Track an analytic event.

    Safe: catches exceptions and logs warnings to avoid breaking the bot.
    """
    try:
        meta_json = json.dumps(meta, ensure_ascii=False) if meta else None
        event = Event(
            ts=datetime.now(timezone.utc).isoformat(),
            tenant_id=_TENANT_ID,
            bot_id=_BOT_ID,
            tg_id=str(tg_id),
            event_name=event_name,
            meta=meta_json,
        )
        async with AsyncSessionLocal() as session:
            session.add(event)
            await session.commit()
    except Exception as e:
        logger.warning(f"Failed to track event '{event_name}': {e}", exc_info=True)
