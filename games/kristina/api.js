/**
 * API для взаимодействия с Telegram WebApp
 * Включает имитацию API для локальной разработки
 */

class TelegramWebAppAPI {
    constructor() {
        this.isTelegram = false;
        this.init();
    }

    init() {
        // Проверяем, находимся ли мы в Telegram WebApp
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            this.isTelegram = true;
            this.setupTelegramWebApp();
        } else {
            this.setupMockAPI();
        }
    }

    setupTelegramWebApp() {
        console.log('Инициализация Telegram WebApp API');
        
        try {
            // Инициализируем WebApp
            Telegram.WebApp.ready();
            
            // Расширяем WebApp на весь экран
            Telegram.WebApp.expand();
            
            // Настраиваем кнопку меню
            this.setupMainButton();
            
            // Настраиваем тему
            this.applyTheme();
            
            // Слушаем события изменения темы
            Telegram.WebApp.onEvent('themeChanged', this.applyTheme.bind(this));
            
            console.log('Telegram WebApp успешно инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации Telegram WebApp:', error);
            this.setupMockAPI();
        }
    }

    setupMockAPI() {
        console.log('Используется Mock API для локальной разработки');
        
        // Создаем глобальный объект Telegram для локальной разработки
        if (typeof Telegram === 'undefined') {
            window.Telegram = {
                WebApp: this.createMockWebApp()
            };
        }
    }

    createMockWebApp() {
        const mockWebApp = {
            // Основные методы
            ready: () => console.log('Mock: WebApp ready'),
            expand: () => console.log('Mock: WebApp expanded'),
            close: () => {
                console.log('Mock: WebApp closed');
                alert('Игра завершена. В реальном Telegram приложение бы закрылось.');
            },
            
            // Отправка данных
            sendData: (data) => {
                console.log('Mock: Data sent to bot:', data);
                this.showMockNotification('Данные отправлены: ' + data);
                return true;
            },
            
            // Кнопки
            MainButton: {
                text: 'Продолжить',
                color: '#4a6fa5',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                show: () => {
                    mockWebApp.MainButton.isVisible = true;
                    console.log('Mock: MainButton shown');
                },
                hide: () => {
                    mockWebApp.MainButton.isVisible = false;
                    console.log('Mock: MainButton hidden');
                },
                setText: (text) => {
                    mockWebApp.MainButton.text = text;
                    console.log('Mock: MainButton text set to', text);
                },
                onClick: (callback) => {
                    mockWebApp.MainButton._clickCallback = callback;
                },
                _clickCallback: null,
                _triggerClick: () => {
                    if (mockWebApp.MainButton._clickCallback) {
                        mockWebApp.MainButton._clickCallback();
                    }
                }
            },
            
            BackButton: {
                isVisible: false,
                show: () => {
                    mockWebApp.BackButton.isVisible = true;
                    console.log('Mock: BackButton shown');
                },
                hide: () => {
                    mockWebApp.BackButton.isVisible = false;
                    console.log('Mock: BackButton hidden');
                },
                onClick: (callback) => {
                    mockWebApp.BackButton._clickCallback = callback;
                },
                _clickCallback: null
            },
            
            // Информация о пользователе
            initData: '',
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: 'Тестовый',
                    last_name: 'Пользователь',
                    username: 'test_user',
                    language_code: 'ru'
                },
                chat: {
                    id: -123456789,
                    type: 'private'
                }
            },
            
            // Параметры
            platform: 'web',
            colorScheme: 'light',
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                hint_color: '#999999',
                link_color: '#4a6fa5',
                button_color: '#4a6fa5',
                button_text_color: '#ffffff'
            },
            
            // События
            onEvent: (event, callback) => {
                console.log('Mock: Event listener added for', event);
                mockWebApp._eventCallbacks = mockWebApp._eventCallbacks || {};
                mockWebApp._eventCallbacks[event] = callback;
            },
            
            offEvent: (event, callback) => {
                console.log('Mock: Event listener removed for', event);
            },
            
            _eventCallbacks: {},
            _triggerEvent: (event, data) => {
                if (mockWebApp._eventCallbacks[event]) {
                    mockWebApp._eventCallbacks[event](data);
                }
            },
            
            // Версия
            version: '7.0',
            isVersionAtLeast: (version) => {
                return true;
            }
        };
        
        return mockWebApp;
    }

    setupMainButton() {
        if (!this.isTelegram) return;
        
        // Создаем основную кнопку
        const mainButton = Telegram.WebApp.MainButton;
        
        // Настраиваем стиль кнопки
        mainButton.setText('Продолжить');
        mainButton.color = '#4a6fa5';
        mainButton.textColor = '#ffffff';
        
        // Скрываем кнопку по умолчанию
        mainButton.hide();
        
        // Обработка нажатия на кнопку
        mainButton.onClick(() => {
            console.log('MainButton clicked');
            this.handleMainButtonClick();
        });
    }

    handleMainButtonClick() {
        // Эта функция будет переопределена в game.js
        console.log('Main button click handler called');
    }

    applyTheme() {
        if (!this.isTelegram) return;
        
        const theme = Telegram.WebApp.themeParams;
        
        // Применяем тему Telegram к странице
        document.documentElement.style.setProperty('--telegram-bg-color', theme.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--telegram-text-color', theme.text_color || '#000000');
        document.documentElement.style.setProperty('--telegram-hint-color', theme.hint_color || '#999999');
        document.documentElement.style.setProperty('--telegram-link-color', theme.link_color || '#4a6fa5');
        document.documentElement.style.setProperty('--telegram-button-color', theme.button_color || '#4a6fa5');
        document.documentElement.style.setProperty('--telegram-button-text-color', theme.button_text_color || '#ffffff');
        
        // Применяем основные цвета к дизайну
        document.body.style.backgroundColor = theme.bg_color || '#f5f7fa';
        
        // Обновляем цвет кнопок
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (btn.classList.contains('btn-secondary')) return;
            btn.style.background = `linear-gradient(to right, ${theme.button_color || '#4a6fa5'}, ${this.adjustColor(theme.button_color || '#4a6fa5', 20)})`;
            btn.style.color = theme.button_text_color || '#ffffff';
        });
    }

    adjustColor(color, percent) {
        // Простая функция для изменения яркости цвета
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    showMainButton(text) {
        if (this.isTelegram) {
            Telegram.WebApp.MainButton.setText(text);
            Telegram.WebApp.MainButton.show();
        } else {
            // Для mock API показываем уведомление
            this.showMockNotification(`Кнопка "${text}" активирована`);
        }
    }

    hideMainButton() {
        if (this.isTelegram) {
            Telegram.WebApp.MainButton.hide();
        }
    }

    setMainButtonText(text) {
        if (this.isTelegram) {
            Telegram.WebApp.MainButton.setText(text);
        }
    }

    enableMainButton() {
        if (this.isTelegram) {
            Telegram.WebApp.MainButton.enable();
        }
    }

    disableMainButton() {
        if (this.isTelegram) {
            Telegram.WebApp.MainButton.disable();
        }
    }

    showBackButton() {
        if (this.isTelegram) {
            Telegram.WebApp.BackButton.show();
        }
    }

    hideBackButton() {
        if (this.isTelegram) {
            Telegram.WebApp.BackButton.hide();
        }
    }

    showMockNotification(message) {
        // Создаем уведомление для mock режима
        const notification = document.createElement('div');
        notification.className = 'mock-notification';
        notification.innerHTML = `
            <div class="mock-notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
                <button class="mock-notification-close"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a6fa5;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.querySelector('.mock-notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.querySelector('.mock-notification-close').style.cssText = `
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: 10px;
            font-size: 1rem;
        `;
        
        // Добавляем в документ
        document.body.appendChild(notification);
        
        // Закрытие при клике
        notification.querySelector('.mock-notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
        
        // Автоматическое закрытие через 5 секунд
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // Добавляем анимации в стили
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Метод для отправки результатов игры
    sendGameResult(resultData) {
        const data = {
            action: 'GAME_RESULT',
            timestamp: Date.now(),
            game: 'hamster_hotel',
            ...resultData
        };
        
        console.log('Отправка результата игры:', data);
        
        if (this.isTelegram) {
            try {
                Telegram.WebApp.sendData(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Ошибка отправки данных в Telegram:', error);
                return false;
            }
        } else {
            // В mock режиме показываем уведомление
            this.showMockNotification(`Результат отправлен: ${resultData.coins} монет, ${resultData.hamsters} хомячков`);
            
            // Также сохраняем в localStorage для отладки
            localStorage.setItem('last_game_result', JSON.stringify(data));
            
            // Имитируем успешную отправку
            return true;
        }
    }

    // Получение информации о пользователе
    getUserInfo() {
        if (this.isTelegram && Telegram.WebApp.initDataUnsafe.user) {
            return Telegram.WebApp.initDataUnsafe.user;
        }
        
        // Mock данные для разработки
        return {
            id: 123456789,
            first_name: 'Игрок',
            last_name: 'Тестовый',
            username: 'test_player',
            language_code: 'ru'
        };
    }

    // Получение информации о чате
    getChatInfo() {
        if (this.isTelegram && Telegram.WebApp.initDataUnsafe.chat) {
            return Telegram.WebApp.initDataUnsafe.chat;
        }
        
        // Mock данные для разработки
        return {
            id: -123456789,
            type: 'private',
            title: 'Тестовый чат'
        };
    }

    // Проверка, находится ли приложение в Telegram
    isInTelegram() {
        return this.isTelegram;
    }

    // Метод для закрытия WebApp
    closeApp() {
        if (this.isTelegram) {
            Telegram.WebApp.close();
        } else {
            this.showMockNotification('Приложение будет закрыто. В реальном Telegram оно закроется автоматически.');
            // В браузере просто показываем сообщение
            setTimeout(() => {
                window.location.href = 'about:blank';
            }, 2000);
        }
    }
}

// Создаем глобальный экземпляр API
const TelegramAPI = new TelegramWebAppAPI();

// Экспортируем для использования в других файлах
window.TelegramAPI = TelegramAPI;