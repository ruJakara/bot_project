from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core import app_state
from models import AsyncSessionLocal, Event

logger = logging.getLogger(__name__)


async def track(event_name: str, tg_id: int, meta: dict | None = None) -> None:
    """Track an analytic event.

    Safe: catches exceptions and logs warnings to avoid breaking the bot.
    """
    try:
        # 1. Gather context
        tenant_id = app_state.get_tenant_id()
        bot_id = app_state.get_bot_id()
        
        # 2. Serialize meta
        meta_json = json.dumps(meta, ensure_ascii=False) if meta else None
        
        # 3. Create event object
        event = Event(
            ts=datetime.now(timezone.utc).isoformat(),
            tenant_id=tenant_id,
            bot_id=bot_id,
            tg_id=str(tg_id),
            event_name=event_name,
            meta=meta_json,
        )

        # 4. Save to DB
        async with AsyncSessionLocal() as session:
            session.add(event)
            await session.commit()
            
    except Exception as e:
        # Fallback: log error but do not crash
        logger.warning(f"Failed to track event '{event_name}': {e}", exc_info=True)
