"""Print last 5 events from the bot database."""

import os
import sqlite3
import sys
from pathlib import Path

# Add project root to path so we can reuse DATABASE_URL default from config
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))


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


CREATE_EVENTS_SQL = """
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  tg_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  meta TEXT
);
"""

def main() -> None:
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Ensure table exists (idempotent)
    cursor.execute(CREATE_EVENTS_SQL)
    conn.commit()

    try:
        cursor.execute("SELECT * FROM events ORDER BY id DESC LIMIT 5")
        rows = cursor.fetchall()

        cursor.execute("PRAGMA table_info(events)")
        headers = [col[1] for col in cursor.fetchall()]

        if not rows:
            print(f"No events found in {db_path}.")
            print(" | ".join(headers))
            return

        print(f"DB: {db_path}")
        print(" | ".join(headers))
        print("-" * 70)
        for row in rows:
            print(row)

    except sqlite3.OperationalError as e:
        print(f"Error reading events table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
