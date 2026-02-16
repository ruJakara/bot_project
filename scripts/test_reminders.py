import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Setup simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from core import app_state
from core.reminders.service import process_due_reminders, enable_reminder, list_due_reminders
from core.config import get_tenant_config
from models import init_db, Reminder, AsyncSessionLocal

async def main():
    logger.info("Starting Reminders test...")
    
    # 1. Init environment
    try:
        if not os.getenv("TENANT_ID"):
             os.environ["TENANT_ID"] = "vojd"
        cfg = get_tenant_config()
        app_state.init_tenant(cfg)
        await init_db()
        logger.info("Environment initialized.")
    except Exception as e:
        logger.error(f"Init failed: {e}")
        return

    # 2. Enable Reminder
    tg_id = 888888
    logger.info(f"Enabling reminder for user {tg_id}...")
    reminder = await enable_reminder(tg_id, months=6)
    logger.info(f"Reminder created/updated. Next remind at: {reminder.next_remind_at}")

    # 3. Check due (should be empty)
    due = await list_due_reminders(datetime.now(timezone.utc))
    logger.info(f"Due reminders (should be 0): {len(due)}")
    
    # 4. Hack: Move reminder to past
    logger.info("Moving reminder to past (manual DB hack)...")
    async with AsyncSessionLocal() as session:
        r = await session.get(Reminder, reminder.id)
        r.next_remind_at = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        await session.commit()
    
    # 5. Process due
    logger.info("Processing due reminders...")
    count = await process_due_reminders()
    logger.info(f"Processed count (should be 1): {count}")

    # 6. Verify processed
    async with AsyncSessionLocal() as session:
        r = await session.get(Reminder, reminder.id)
        if not r.enabled:
             logger.info("SUCCESS: Reminder was disabled after processing.")
        else:
             logger.error("FAIL: Reminder is still enabled!")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
