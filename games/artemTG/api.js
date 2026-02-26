// Telegram WebApp Bridge
const TelegramAPI = {
  webApp: null,
  initData: null,
  user: null,
  
  init() {
    // Проверка наличия Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.initData = this.webApp.initData || '';
      this.user = this.webApp.initDataUnsafe?.user || null;
      
      console.log('📱 Telegram API инициализирован');
      console.log('👤 Пользователь:', this.user);
      
      // Настройка WebApp
      this.setupWebApp();
    } else {
      console.log('⚠️ Запуск вне Telegram WebApp');
    }
  },
  
  setupWebApp() {
    // Показать главное меню кнопок
    this.webApp.ready();
    
    // Разрешить закрытие приложения
    this.webApp.MainButton.hide();
    
    // Включить вертикальную развертку
    this.webApp.expand();
    
    // Настроить тему под дизайн игры
    this.webApp.setBackgroundColor('#0f0f2d');
    this.webApp.setHeaderColor('#0f0f2d');
    
    // Включить вибрацию (если поддерживается)
    this.enableHaptic();
  },
  
  enableHaptic() {
    if (this.webApp.HapticFeedback) {
      window.hapticImpact = () => {
        try {
          this.webApp.HapticFeedback.impactOccurred('medium');
        } catch (e) {
          console.log('⚠️ Haptic не поддерживается:', e);
        }
      };
      
      window.hapticNotification = (type = 'success') => {
        try {
          this.webApp.HapticFeedback.notificationOccurred(type);
        } catch (e) {
          console.log('⚠️ Haptic notification не поддерживается:', e);
        }
      };
    } else {
      // Фолбэк: вибрация через API браузера
      window.hapticImpact = () => {
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      };
      
      window.hapticNotification = () => {
        if (navigator.vibrate) {
          navigator.vibrate([30, 20, 30]);
        }
      };
    }
  },
  
  // Отправка результата в бота
  sendResult(data) {
    if (!this.webApp) return false;
    
    try {
      // Формат: параметр1=значение1&параметр2=значение2
      const resultString = Object.entries(data)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      this.webApp.sendData(resultString);
      console.log('📤 Данные отправлены:', resultString);
      return true;
    } catch (e) {
      console.error('❌ Ошибка отправки:', e);
      return false;
    }
  },
  
  // Запрос разрешения на уведомления
  requestPermission() {
    if (!this.webApp) return Promise.resolve(false);
    
    return new Promise((resolve) => {
      this.webApp.requestWriteAccess((result) => {
        console.log('🔑 Доступ получен:', result);
        resolve(result);
      });
    });
  },
  
  // Открытие ссылки в безопасном режиме
  openLink(url, options = {}) {
    if (!this.webApp) {
      window.open(url, '_blank');
      return;
    }
    
    this.webApp.openLink(url, options);
  },
  
  // Показать всплывающее уведомление
  showAlert(message, callback = null) {
    if (!this.webApp) {
      alert(message);
      if (callback) callback();
      return;
    }
    
    this.webApp.showAlert(message, callback);
  },
  
  // Показать подтверждение
  showConfirm(message, callback = null) {
    if (!this.webApp) {
      const result = confirm(message);
      if (callback) callback(result);
      return;
    }
    
    this.webApp.showConfirm(message, callback);
  },
  
  // Поделиться результатом
  shareText(text, options = {}) {
    if (!this.webApp) {
      navigator.clipboard?.writeText(text);
      return;
    }
    
    this.webApp.shareText(text, options);
  },
  
  // Получить информацию о пользователе
  getUser() {
    return this.user;
  },
  
  // Проверить, запущено ли в Telegram
  isInTelegram() {
    return !!this.webApp;
  },
  
  // Получить параметры запуска (например, реферальный код)
  getStartParam() {
    return this.webApp?.initDataUnsafe?.start_param || null;
  }
};

// Автоинициализация
TelegramAPI.init();

// Глобальный доступ
window.TelegramAPI = TelegramAPI;