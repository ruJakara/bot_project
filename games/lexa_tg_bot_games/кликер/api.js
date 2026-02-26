const TelegramAPI = {
    init() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.themeParams.bg_color && (document.body.style.background = tg.themeParams.bg_color);
        }
    },

    sendGAME_RESULT(data) {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                event: 'GAME_RESULT',
                data: data
            }));
        } else {
            console.log('GAME_RESULT:', data); // для теста
        }
    }
};

TelegramAPI.init();
