// Интеграция с Telegram WebApp
class TelegramAPI {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        // Проверяем, находимся ли мы в Telegram WebApp
        if (window.Telegram && Telegram.WebApp) {
            this.initialized = true;
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            this.setupTheme();
        } else {
            console.log('Telegram WebApp не обнаружен, игра работает в автономном режиме');
        }
    }

    setupTheme() {
        if (!this.initialized) return;
        
        // Устанавливаем тему Telegram
        document.documentElement.style.setProperty('--bg-color', Telegram.WebApp.backgroundColor);
        document.documentElement.style.setProperty('--text-color', Telegram.WebApp.textColor);
        
        // Следим за изменениями темы
        Telegram.WebApp.onEvent('themeChanged', this.setupTheme.bind(this));
    }

    sendGameResult(score, lines, level) {
        if (!this.initialized) {
            console.log('Результат игры (не отправлено в Telegram):', { score, lines, level });
            return;
        }

        const gameResult = {
            score: score,
            lines: lines,
            level: level,
            timestamp: Date.now()
        };

        try {
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'GAME_RESULT',
                data: gameResult
            }));
            console.log('Результат игры отправлен:', gameResult);
        } catch (error) {
            console.error('Ошибка при отправке результата:', error);
        }
    }

    shareResult(message) {
        if (!this.initialized) {
            alert(message);
            return;
        }

        try {
            Telegram.WebApp.showAlert(message);
        } catch (error) {
            console.error('Ошибка при публикации результата:', error);
        }
    }
}

// Инициализация API Telegram
const telegramAPI = new TelegramAPI();

// Глобальные функции для использования в game.js
function sendGameResult(score, lines, level) {
    telegramAPI.sendGameResult(score, lines, level);
}

function TelegramGameShare(message) {
    telegramAPI.shareResult(message);
}

// Экспорт для использования в других модулях
window.TelegramAPI = telegramAPI;