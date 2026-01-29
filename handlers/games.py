    game_id = callback.data.replace("game_", "")
    games = load_games()
    game = next((g for g in games if g["id"] == game_id), None)
    if not game:
        await callback.answer("Игра не найдена")
        return

    session_id = str(uuid.uuid4())
    game_path = settings.game_paths.get(game_id, f"teGame/{game_id}/index.html")
    url = f"https://{settings.domain}/{game_path}?sessionid={session_id}"
    
    await callback.message.answer(
        f"🎮 {game['name']}\n\nНажми кнопку ниже, чтобы начать игру.",
        reply_markup=play_game_keyboard(url),
    )
    await callback.answer()

@router.message(F.web_app_data)
async def handle_web_app_data(message: Message) -> None:
    try:
        data: GameResultPayload = json.loads(message.web_app_data.data)
    except Exception:
        await message.answer("Не удалось прочитать результат игры.")
        return

    game_id = data.get("game_id", "unknown")
    score = int(data.get("score", 0))
    duration = int(data.get("duration_sec", 0))

    async with AsyncSessionLocal() as session:
        user = await session.get(User, message.from_user.id)
        if user is None:
            user = User(
                id=message.from_user.id,
                username=message.from_user.username,