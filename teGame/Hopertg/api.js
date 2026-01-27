class GameAPI {
    constructor() {
        this.telegram = null;
        this.isTelegram = false;
        this.initTelegram();
    }

    initTelegram() {
        if (window.Telegram?.WebApp) {
            this.telegram = window.Telegram.WebApp;
            this.isTelegram = true;
            this.setupTelegram();
            console.log('✅ Запущено в Telegram WebApp');
        } else {
            console.log('ℹ️ Запущено в браузере (не в Telegram)');
            this.telegram = {
                ready: () => {},
                expand: () => {},
                MainButton: {
                    setText: () => {},
                    show: () => {},
                    hide: () => {},
                    onClick: () => {},
                },
                sendData: (data) => {
                    console.log('📤 [Браузер] Отправлено:', data);
                },
                HapticFeedback: null,
            };
        }
    }

    setupTelegram() {
        this.telegram.ready();
        this.telegram.expand();
        this.telegram.MainButton.setText('Поделиться результатом');
        this.telegram.MainButton.show();
    }

    setGameRef(gameRef) {
        this.gameRef = gameRef;
    }

    sendResult(data) {
        if (this.telegram) {
            const payload = { GAME_RESULT: data };
            this.telegram.sendData(JSON.stringify(payload));
            if (this.isTelegram) {
                this.telegram.MainButton.setText('Отправлено! 🎉');
                if (this.telegram.HapticFeedback?.notificationOccurred) {
                    this.telegram.HapticFeedback.notificationOccurred('success');
                }
            }
        }
        console.log('📤 Результат отправлен:', data);
    }

    setMainButtonText(text) {
        if (this.telegram?.MainButton) {
            this.telegram.MainButton.setText(text);
        }
    }

    hapticFeedback(type = 'light') {
        if (this.isTelegram && this.telegram?.HapticFeedback?.impactOccurred) {
            this.telegram.HapticFeedback.impactOccurred(type);
        }
    }
}

window.GameAPI = GameAPI;