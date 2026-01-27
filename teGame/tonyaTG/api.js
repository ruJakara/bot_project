// API для взаимодействия с Telegram WebApp
const TelegramAPI = {
    // Инициализация Telegram WebApp
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.WebApp = Telegram.WebApp;
            this.WebApp.ready();
            this.WebApp.expand();
            return true;
        }
        return false;
    },

    // Отправка данных в Telegram
    sendData(data) {
        if (this.WebApp) {
            this.WebApp.sendData(JSON.stringify(data));
        } else {
            console.log('Telegram WebApp не инициализирован. Отправлены данные:', data);
        }
    },

    // Получение информации о пользователе
    getUserData() {
        if (this.WebApp && this.WebApp.initDataUnsafe && this.WebApp.initDataUnsafe.user) {
            return this.WebApp.initDataUnsafe.user;
        }
        return null;
    },

    // Закрытие приложения
    closeApp() {
        if (this.WebApp) {
            this.WebApp.close();
        }
    }
};