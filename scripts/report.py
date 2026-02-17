"""Analytics report from the bot database (events table)."""

import json
import logging
import os
import sqlite3
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def _get_db_path() -> str:
    """Derive SQLite file path from DATABASE_URL (same source the bot uses).

    Priority: DB_PATH (explicit override) → DATABASE_URL → bot.db
    DATABASE_URL format: sqlite+aiosqlite:///./bot.db  →  ./bot.db
    """
    explicit = os.getenv("DB_PATH")
    if explicit:
        return explicit
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bot.db")
    if ":///" in db_url:
        return db_url.split("///", 1)[1]
    return "bot.db"


def main():
    # 1. Config
    DB_PATH = _get_db_path()
    TENANT_ID = os.getenv("TENANT_ID")
    BOT_ID = os.getenv("BOT_ID")
    DAYS = int(os.getenv("DAYS", "7"))

    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found at {DB_PATH}")
        return

    # 2. Time Range
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=DAYS)
    start_iso = start_date.isoformat()

    logger.info(f"--- Analytics Report ({DAYS} days) ---")
    logger.info(f"From: {start_iso}")
    logger.info(f"To:   {now.isoformat()}")
    if TENANT_ID:
        logger.info(f"Tenant: {TENANT_ID}")
    if BOT_ID:
        logger.info(f"Bot:    {BOT_ID}")
    logger.info("-" * 40)

    # 3. Load Events
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM events WHERE ts >= ?"
    params = [start_iso]

    if TENANT_ID:
        query += " AND tenant_id = ?"
        params.append(TENANT_ID)
    if BOT_ID:
        query += " AND bot_id = ?"
        params.append(BOT_ID)

    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
    except sqlite3.OperationalError as e:
        logger.error(f"Error reading DB: {e}")
        conn.close()
        return

    conn.close()

    logger.info(f"Total events found: {len(rows)}")
    logger.info("-" * 40)

    if not rows:
        return

    # 4. Process Data
    # Counters
    funnel_counts = Counter()
    
    # Game Stats
    games_opened = Counter()
    games_finished = Counter()
    
    # Sets for conversion
    users_finished = set()
    users_purchase_intent = set()

    for row in rows:
        event = row["event_name"]
        tg_id = row["tg_id"]
        funnel_counts[event] += 1
        
        try:
            meta = json.loads(row["meta"]) if row["meta"] else {}
        except json.JSONDecodeError:
            meta = {}

        if event == "game.opened":
            game_id = meta.get("game_id", "unknown")
            games_opened[game_id] += 1
            
        elif event == "game.finished":
            game_id = meta.get("game_id", "unknown")
            games_finished[game_id] += 1
            users_finished.add(tg_id)
            
        elif event == "purchase.intent":
            users_purchase_intent.add(tg_id)

    # 5. Print Results

    # D) Funnel
    print("\n[D] Funnel Counts:")
    steps = [
        "user.started",
        "game.opened",
        "game.finished",
        "purchase.intent",
        "reminder.enabled",
        "reminder.sent"
    ]
    for step in steps:
        print(f"  {step:<20}: {funnel_counts[step]}")

    # A) Top Games Opened
    print("\n[A] Top Games Opened (by sessions):")
    if not games_opened:
        print("  (model empty)")
    for gid, count in games_opened.most_common(5):
        print(f"  {gid:<20}: {count}")

    # B) Top Games Finished
    print("\n[B] Top Games Finished (by sessions):")
    if not games_finished:
        print("  (none)")
    for gid, count in games_finished.most_common(5):
        print(f"  {gid:<20}: {count}")

    # C) Conversion
    print("\n[C] Conversion (Finished -> Purchase Intent):")
    finished_count = len(users_finished)
    intent_count = len(users_purchase_intent)
    
    # Intersection: users who finished AND showed intent
    converted_users = users_finished.intersection(users_purchase_intent)
    converted_count = len(converted_users)

    if finished_count > 0:
        cr = (converted_count / finished_count) * 100
        print(f"  Unique Finished Users : {finished_count}")
        print(f"  Unique Intent Users   : {intent_count}")
        print(f"  Converted Users       : {converted_count}")
        print(f"  Conversion Rate       : {cr:.2f}%")
    else:
        print("  Conversion Rate       : N/A (no finished users)")

if __name__ == "__main__":
    main()
