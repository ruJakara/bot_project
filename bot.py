import json
import uuid
import os
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiohttp import web
import asyncio

async def handle(request):
    return web.Response(text="Bot is running!")

async def start_server():
    app = web.Application()
    app.add_routes([web.get('/', handle)])
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", int(os.getenv("PORT", 10000)))
    await site.start()


# === НАСТРОЙКИ ===
BOT_TOKEN = os.getenv("BOT_TOKEN")  # Замени на свой токен
DOMAIN = "rujakara.github.io"
GAME_PATH = "telegram-Games/teGame/Index.html"
# === ПУТИ К ФАЙЛАМ ===
GAMES_FILE = "games.json"
USERS_FILE = "users.json"

# === РАБОТА С ФАЙЛАМИ ===

def load_games():
    """Загружает список игр из файла"""
    if not os.path.exists(GAMES_FILE):
        return []
    with open(GAMES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_users():
    """Загружает данные пользователей из файла"""
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_users(users):
    """Сохраняет данные пользователей в файл"""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

# === КЛАВИАТУРЫ ===

def main_keyboard():
    """Главное меню с кнопками"""
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📦 Каталог")],
            [KeyboardButton(text="🎮 Играть")]
        ],
        resize_keyboard=True
    )
    return keyboard

def games_keyboard(games):
    """Клавиатура со списком игр"""
    buttons = []
    for game in games:
        if game.get("enabled", False):
            buttons.append([
                InlineKeyboardButton(
                    text=game["name"],
                    callback_data=f"game_{game['id']}"
                )
            ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def play_game_keyboard(game_id, session_id):
    url = f"https://{DOMAIN}/{GAME_PATH}?session_id={session_id}"
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(
                text="🎮 Запустить игру",
                web_app=WebAppInfo(url=url)
            )
        ]]
    )
    return keyboard

# === СОЗДАЁМ БОТА ===
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# === ОБРАБОТЧИКИ ===

@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Обработка команды /start"""
    await message.answer(
        "👋 Привет! Я бот с мини-играми.\n\n"
        "📦 Каталог — посмотреть список игр\n"
        "🎮 Играть — выбрать и запустить игру",
        reply_markup=main_keyboard()
    )

@dp.message(F.text == "📦 Каталог")
async def show_catalog(message: Message):
    """Показывает каталог игр"""
    games = load_games()
    enabled_games = [g for g in games if g.get("enabled", False)]
    
    if not enabled_games:
        await message.answer("😔 Пока нет доступных игр")
        return
    
    text = "📦 Каталог игр:\n\n"
    for game in enabled_games:
        text += f"🎮 {game['name']}\n"
        text += f"   {game.get('description', 'Без описания')}\n\n"
    
    await message.answer(text)

@dp.message(F.text == "🎮 Играть")
async def show_games_to_play(message: Message):
    """Показывает кнопки для выбора игры"""
    games = load_games()
    enabled_games = [g for g in games if g.get("enabled", False)]
    
    if not enabled_games:
        await message.answer("😔 Пока нет доступных игр")
        return
    
    await message.answer(
        "🎮 Выбери игру:",
        reply_markup=games_keyboard(enabled_games)
    )

@dp.callback_query(F.data.startswith("game_"))
async def select_game(callback: CallbackQuery):
    """Обработка выбора игры"""
    game_id = callback.data.replace("game_", "")
    games = load_games()
    
    # Ищем игру по id
    game = None
    for g in games:
        if g["id"] == game_id:
            game = g
            break
    
    if not game:
        await callback.answer("Игра не найдена")
        return
    
    # Генерируем session_id
    session_id = str(uuid.uuid4())
    
    await callback.message.answer(
        f"🎮 {game['name']}\n\n"
        f"Нажми кнопку ниже, чтобы начать игру!",
        reply_markup=play_game_keyboard(game_id, session_id)
    )
    await callback.answer()

@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message):
    """Обработка результата из игры"""
    try:
        # Парсим данные из игры
        data = json.loads(message.web_app_data.data)
        
        game_id = data.get("game_id", "unknown")
        score = data.get("score", 0)
        duration = data.get("duration_sec", 0)
        
        # Загружаем пользователей
        users = load_users()
        user_id = str(message.from_user.id)
        
        # Если пользователя нет — создаём
        if user_id not in users:
            users[user_id] = {
                "username": message.from_user.username,
                "games": []
            }
        
        # Добавляем результат игры
        users[user_id]["games"].append({
            "game_id": game_id,
            "score": score,
            "duration_sec": duration
        })
        
        # Сохраняем
        save_users(users)
        
        # Отправляем сообщение с результатом
        await message.answer(
            f"🏆 Игра завершена!\n\n"
            f"🎮 Игра: {game_id}\n"
            f"⭐ Очки: {score}\n"
            f"⏱ Время: {duration} сек",
            reply_markup=main_keyboard()
        )
        
    except Exception as e:
        await message.answer(f"❌ Ошибка: не удалось обработать результат")

# === ЗАПУСК БОТА ===

async def main():
    await start_server()
    print("🤖 Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
