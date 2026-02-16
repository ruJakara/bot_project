import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "bot.db")

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
    conn = sqlite3.connect(DB_PATH)
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
            print(f"No events found in {DB_PATH}.")
            print(" | ".join(headers))
            return

        print(f"DB: {DB_PATH}")
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
