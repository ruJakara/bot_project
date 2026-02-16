import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Mock dotenv load
from dotenv import load_dotenv
load_dotenv()

from config import get_settings

def main():
    print("--- Static Files Check ---")
    
    # 1. Check RENDER_URL
    render_url = os.getenv("RENDER_URL")
    if not render_url:
        print("[FAIL] RENDER_URL is not set! Games will launch as 'https://None/...'")
        print("       Set RENDER_URL in .env to your bot's public address (e.g. ngrok or render.com)")
    else:
        print(f"[OK] RENDER_URL = {render_url}")

    # 2. Check teGame folder
    te_game_root = PROJECT_ROOT / "teGame"
    if not te_game_root.is_dir():
        print(f"[FAIL] teGame directory not found at {te_game_root}")
        return
    else:
        print(f"[OK] teGame directory exists at {te_game_root}")

    # 3. Check each game path
    try:
        settings = get_settings()
    except Exception as e:
        print(f"[FAIL] Could not load settings: {e}")
        return

    print("\n--- Games Paths ---")
    fail_count = 0
    for game_id, rel_path in settings.game_paths.items():
        # config path starts with "teGame/...", so it's relative to PROJECT_ROOT
        abs_path = PROJECT_ROOT / rel_path
        
        if abs_path.is_file():
            print(f"[OK] {game_id}: {rel_path}")
        else:
            print(f"[FAIL] {game_id}: {rel_path} -> File not found!")
            print(f"       Expected: {abs_path}")
            fail_count += 1

    if fail_count > 0:
        print(f"\n[SUMMARY] {fail_count} games refer to missing files.")
    else:
        print("\n[SUMMARY] All game paths are valid.")

if __name__ == "__main__":
    main()
