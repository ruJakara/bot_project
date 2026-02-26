// Telegram WebApp API Bridge
const TelegramAPI = {
    WebApp: null,
    init: function() {
        // Проверяем, запущено ли приложение в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            this.WebApp = window.Telegram.WebApp;
            this.WebApp.ready();
            
            // Настройки темы
            this.WebApp.setHeaderColor('#1a365d');
            this.WebApp.setBackgroundColor('#0c4a6e');
            
            // Разрешаем вертикальное свайп-закрытие
            if (this.WebApp.isVersionAtLeast('6.1')) {
                this.WebApp.enableClosingConfirmation();
            }
            
            return true;
        }
        
        // Для тестирования в браузере
        console.log('Telegram WebApp API не обнаружен (браузерный режим)');
        return false;
    },
    
    shareScore: function(score) {
        if (!this.WebApp) {
            console.log('Поделиться результатом:', score);
            alert(`Твой результат: ${score} голов!`);
            return;
        }
        
        const text = `⚽ Я забил ${score} голов в Пенальти! Сможешь больше?`;
        const button = this.WebApp.showSharePopup({
            text: text
        });
    },
    
    expand: function() {
        if (this.WebApp && this.WebApp.expand) {
            this.WebApp.expand();
        }
    },
    
    isTelegram: function() {
        return !!this.WebApp;
    }
};

// Инициализация при загрузке
TelegramAPI.init();