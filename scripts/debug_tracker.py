# debug_tracker.py (updated to use correct imports)
import asyncio
import logging
import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Setup simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from core import app_state
from core.events.tracker import track
from core.config import get_tenant_config
from models import init_db

async def main():
    logger.info("Starting debug tracker...")
    
    # 1. Init tenant (required for track)
    try:
        # Manually force tenant_id=vojd if env not set
        if not os.getenv("TENANT_ID"):
             os.environ["TENANT_ID"] = "vojd"
        
        cfg = get_tenant_config()
        app_state.init_tenant(cfg)
        logger.info(f"Tenant initialized: {cfg.get('tenant_id')}")
    except Exception as e:
        logger.error(f"Failed to init tenant: {e}")
        return

    # 2. Init DB (ensure table exists)
    try:
        await init_db()
        logger.info("DB initialized via SQLAlchemy")
    except Exception as e:
        logger.error(f"Failed to init DB: {e}")
        return

    # 3. Track event
    try:
        logger.info("Tracking 'debug.test' event...")
        await track("debug.test", 999999, {"debug": True})
        logger.info("Event tracked!")
    except Exception as e:
        logger.error(f"Failed during track(): {e}")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
