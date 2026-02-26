// api.js (без изменений)
class GameAPI {
    constructor() {
        this.initTelegram();
    }

    initTelegram() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.MainButton.setText('Отправить результат').show().onClick(this.sendResult.bind(this));
        }
    }

    sendResult(data) {
        const result = {
            score: data.score,
            moves: data.moves,
            timeLeft: data.timeLeft,
            completed: data.completed,
            timestamp: Date.now()
        };

        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                game: 'perelivayka_zone',
                result: result
            }));
            window.Telegram.WebApp.MainButton.hide();
        }
    }
}

window.gameAPI = new GameAPI();
