function sendResultToBot(score) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({
            type: "GAME_RESULT",
            score: score,
            developer: "Тимур, 14 лет"
        }));
    }
}