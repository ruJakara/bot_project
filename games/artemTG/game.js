// Главная точка входа игры
const Game = {
  engine: null,
  state: null,
  ui: null,
  scenes: null,
  telegram: null,
  
  init() {
    console.log('🎮 Игра инициализируется...');
    
    // Инициализация модулей
    this.state = GameState;
    this.state.init();
    
    this.engine = GameEngine;
    this.engine.init();
    
    this.ui = GameUI;
    this.ui.init();
    
    this.scenes = GameScenes;
    this.scenes.init();
    
    // Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      this.telegram = window.Telegram.WebApp;
      console.log('📱 Telegram WebApp готов');
      this.telegram.ready();
    }
    
    // Показать стартовый экран
    this.scenes.showScene(CONFIG.SCENES.START);
    
    // Загрузить лучший результат
    this.ui.updateBestScore();
    
    // Инициализировать ввод ПОСЛЕ загрузки всех модулей
    setTimeout(() => {
      GameInput.init();
    }, 100);
    
    console.log('✅ Игра готова!');
  },
  
  start() {
    console.log('▶️ Начало игры');
    
    // Сбросить состояние
    this.state.reset();
    
    // Показать игровой экран
    this.scenes.showScene(CONFIG.SCENES.GAME);
    
    // Запустить таймер
    GameTimer.start();
    
    // Запустить игровой цикл
    this.engine.start();
    
    // Показать первое событие
    setTimeout(() => {
      this.state.showEvent();
    }, 500);
  },
  
  end() {
    console.log('⏹️ Игра завершена');
    
    // Остановить таймер и движок
    GameTimer.stop();
    this.engine.stop();
    
    // Определить концовку и достижения
    const ending = this.state.getEnding();
    const achievements = this.state.getAchievements();
    
    // Сохранить результат
    Storage.saveResult({
      cash: this.state.cash,
      rep: this.state.rep,
      risk: this.state.risk,
      ending: ending.id,
      achievements: achievements.map(a => a.id)
    });
    
    // Показать результат
    this.ui.showResult(ending, achievements);
    this.scenes.showScene(CONFIG.SCENES.RESULT);
    
    // Отправить в Telegram
    this.sendToTelegram(ending, achievements);
  },
  
  restart() {
    console.log('🔄 Перезапуск игры');
    this.start();
  },
  
  sendToTelegram(ending, achievements) {
    if (!this.telegram) return;
    
    const resultData = {
      score: this.state.cash,
      ending: ending.id,
      achievements: achievements.map(a => a.id).join(','),
      cash: this.state.cash,
      rep: this.state.rep,
      risk: this.state.risk
    };
    
    try {
      this.telegram.sendData(JSON.stringify(resultData));
      console.log('📤 Результат отправлен в Telegram');
    } catch (e) {
      console.log('⚠️ Не удалось отправить в Telegram:', e);
    }
  },
  
  // Обработчики событий
  onChoice(choice) {
    console.log('🎯 Выбор:', choice);
    
    // Применить эффекты
    this.state.applyChoice(choice);
    
    // Показать следующее событие или завершить игру
    if (this.state.eventIndex < CONFIG.EVENTS.length - 1) {
      setTimeout(() => {
        this.state.nextEvent();
      }, 800);
    } else {
      setTimeout(() => {
        this.end();
      }, 1000);
    }
  }
};

// Инициализация при полной загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

// Экспорт для глобального доступа
window.Game = Game;