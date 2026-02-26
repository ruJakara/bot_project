// Универсальный обработчик ввода (клик/тач/клавиатура/колесико)
const GameInput = {
  handlers: {
    click: [],
    touch: [],
    keydown: [],
    wheel: []
  },
  
  init() {
    console.log('👆 Инициализация ввода...');
    
    // Подождать, пока все элементы загрузятся
    setTimeout(() => {
      this.setupAllButtons();
      this.setupKeyboard();
      this.setupWheel();
      this.disableContextMenu();
      
      console.log('✅ Ввод полностью инициализирован');
    }, 50);
  },
  
  setupAllButtons() {
    // Удаляем старые обработчики (на случай повторной инициализации)
    this.removeEventListeners();
    
    // Кнопка "Начать игру"
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎮 Кнопка Начать нажата');
        this.triggerHaptic();
        if (window.Game && typeof window.Game.start === 'function') {
          window.Game.start();
        }
      };
      
      btnStart.addEventListener('click', handleClick);
      
      // Также для тач-устройств
      btnStart.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleClick(e);
      }, { passive: false });
    }
    
    // Кнопка "Новая игра"
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        if (window.Game && typeof window.Game.restart === 'function') {
          window.Game.restart();
        }
      });
    }
    
    // Кнопка "Поделиться"
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
      btnShare.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.shareResult();
      });
    }
    
    // Кнопка "Достижения" в меню
    const btnAchievements = document.getElementById('btn-achievements');
    if (btnAchievements) {
      btnAchievements.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.showAchievements();
      });
    }
    
    // Кнопка "История" в меню
    const btnHistory = document.getElementById('btn-history');
    if (btnHistory) {
      btnHistory.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.showHistory();
      });
    }
    
    // Кнопка "Статистика" в меню
    const btnStats = document.getElementById('btn-stats');
    if (btnStats) {
      btnStats.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.showStats();
      });
    }
    
    // Кнопки "Назад" из сцен
    const btnBackAchievements = document.getElementById('btn-back-achievements');
    const btnBackAchievements2 = document.getElementById('btn-back-achievements-2');
    if (btnBackAchievements) {
      btnBackAchievements.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    if (btnBackAchievements2) {
      btnBackAchievements2.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    
    const btnBackHistory = document.getElementById('btn-back-history');
    const btnBackHistory2 = document.getElementById('btn-back-history-2');
    if (btnBackHistory) {
      btnBackHistory.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    if (btnBackHistory2) {
      btnBackHistory2.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    
    const btnBackStats = document.getElementById('btn-back-stats');
    const btnBackStats2 = document.getElementById('btn-back-stats-2');
    if (btnBackStats) {
      btnBackStats.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    if (btnBackStats2) {
      btnBackStats2.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    
    // Кнопка "В меню" из игровой сцены
    const btnMenuGame = document.getElementById('btn-menu-game');
    if (btnMenuGame) {
      btnMenuGame.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        if (confirm('Выйти в меню? Прогресс будет потерян.')) {
          this.goToMenu();
        }
      });
    }
    
    // Кнопка "В меню" из сцены результатов
    const btnMenuResult = document.getElementById('btn-menu-result');
    if (btnMenuResult) {
      btnMenuResult.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        this.goToMenu();
      });
    }
    
    // Кнопки выбора
    const choiceA = document.getElementById('choice-a');
    const choiceB = document.getElementById('choice-b');
    
    if (choiceA) {
      choiceA.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        if (window.Game && typeof window.Game.onChoice === 'function') {
          window.Game.onChoice('a');
        }
      });
    }
    
    if (choiceB) {
      choiceB.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerHaptic();
        if (window.Game && typeof window.Game.onChoice === 'function') {
          window.Game.onChoice('b');
        }
      });
    }
    
    console.log('✅ Кнопки настроены');
  },
  
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Клавиша A или 1
      if (e.key === 'a' || e.key === 'ф' || e.key === '1') {
        e.preventDefault();
        const gameScene = document.getElementById('scene-game');
        if (gameScene && gameScene.classList.contains('active')) {
          this.triggerHaptic();
          if (window.Game && typeof window.Game.onChoice === 'function') {
            window.Game.onChoice('a');
          }
        }
      }
      
      // Клавиша B или 2
      if (e.key === 'b' || e.key === 'и' || e.key === '2') {
        e.preventDefault();
        const gameScene = document.getElementById('scene-game');
        if (gameScene && gameScene.classList.contains('active')) {
          this.triggerHaptic();
          if (window.Game && typeof window.Game.onChoice === 'function') {
            window.Game.onChoice('b');
          }
        }
      }
      
      // Enter - начать игру или перезапустить
      if (e.key === 'Enter') {
        e.preventDefault();
        const startScene = document.getElementById('scene-start');
        const resultScene = document.getElementById('scene-result');
        
        if (startScene && startScene.classList.contains('active')) {
          this.triggerHaptic();
          if (window.Game && typeof window.Game.start === 'function') {
            window.Game.start();
          }
        } else if (resultScene && resultScene.classList.contains('active')) {
          this.triggerHaptic();
          if (window.Game && typeof window.Game.restart === 'function') {
            window.Game.restart();
          }
        }
      }
      
      // ESC - вернуться в меню
      if (e.key === 'Escape') {
        e.preventDefault();
        const gameScene = document.getElementById('scene-game');
        const resultScene = document.getElementById('scene-result');
        const achievementsScene = document.getElementById('scene-achievements');
        const historyScene = document.getElementById('scene-history');
        const statsScene = document.getElementById('scene-stats');
        
        if (gameScene && gameScene.classList.contains('active')) {
          if (confirm('Выйти в меню? Прогресс будет потерян.')) {
            this.goToMenu();
          }
        } else if (resultScene && resultScene.classList.contains('active')) {
          this.goToMenu();
        } else if (achievementsScene && achievementsScene.classList.contains('active')) {
          this.goToMenu();
        } else if (historyScene && historyScene.classList.contains('active')) {
          this.goToMenu();
        } else if (statsScene && statsScene.classList.contains('active')) {
          this.goToMenu();
        }
      }
      
      // Вызов коллбэков
      this.handlers.keydown.forEach(cb => cb(e));
    });
    
    console.log('✅ Клавиатура настроена');
  },
  
  setupWheel() {
    // ГЛОБАЛЬНАЯ ПРОКРУТКА КОЛЕСИКОМ - РАБОТАЕТ ВЕЗДЕ!
    document.addEventListener('wheel', (e) => {
      // Разрешаем прокрутку для сцен с прокруткой
      const scenesWithScroll = [
        'scene-start',
        'scene-result',
        'scene-achievements',
        'scene-history',
        'scene-stats'
      ];
      
      for (const sceneId of scenesWithScroll) {
        const scene = document.getElementById(sceneId);
        if (scene && scene.classList.contains('active')) {
          scene.scrollBy({
            top: e.deltaY,
            behavior: 'smooth'
          });
          e.preventDefault();
          return;
        }
      }
      
      // Вызов кастомных обработчиков
      this.handlers.wheel.forEach(cb => cb(e));
    }, { passive: false });
    
    console.log('✅ Колесико мыши настроено (глобально)');
  },
  
  // Показать экран достижений
  showAchievements() {
    console.log('🏆 Открытие экрана достижений');
    if (window.Game && window.Game.scenes) {
      window.Game.scenes.showScene('scene-achievements');
      if (window.Game.ui) {
        window.Game.ui.updateAchievementsScreen();
      }
    }
  },
  
  // Показать экран истории
  showHistory() {
    console.log('📜 Открытие экрана истории');
    if (window.Game && window.Game.scenes) {
      window.Game.scenes.showScene('scene-history');
      if (window.Game.ui) {
        window.Game.ui.updateHistoryScreen();
      }
    }
  },
  
  // Показать экран статистики
  showStats() {
    console.log('📊 Открытие экрана статистики');
    if (window.Game && window.Game.scenes) {
      window.Game.scenes.showScene('scene-stats');
      if (window.Game.ui) {
        window.Game.ui.updateStatsScreen();
      }
    }
  },
  
  // Вернуться в главное меню
  goToMenu() {
    console.log('🏠 Возврат в меню');
    
    // Остановить игру если она идёт
    if (window.Game && window.Game.engine && window.Game.engine.isRunning()) {
      GameTimer.stop();
      window.Game.engine.stop();
    }
    
    // Показать стартовый экран
    if (window.Game && window.Game.scenes) {
      window.Game.scenes.showScene(CONFIG.SCENES.START);
      // Обновить информацию в меню
      if (window.Game.ui) {
        window.Game.ui.updateMenuInfo();
      }
    }
  },
  
  removeEventListeners() {
    // Очистка для избежания дублирования
  },
  
  // Вибрация/тактильная отдача
  triggerHaptic() {
    if (typeof window.hapticImpact === 'function') {
      window.hapticImpact();
    }
  },
  
  // Поделиться результатом
  shareResult() {
    const state = window.Game?.state;
    if (!state) return;
    
    const ending = state.getEnding();
    const text = `Я прошел финансовую игру "60 секунд" и получил концовку "${ending.title}"!\n\n` +
                 `₿ Кэш: ${state.cash}\n` +
                 `⭐ Репутация: ${state.rep}\n` +
                 `⚡ Риск: ${state.risk}\n\n` +
                 `Попробуй и ты!`;
    
    if (typeof window.TelegramAPI?.shareText === 'function') {
      window.TelegramAPI.shareText(text);
    } else if (navigator.share) {
      navigator.share({
        title: '60 секунд - Финансовая игра',
        text: text
      }).catch(() => {
        navigator.clipboard?.writeText(text);
        this.showNotification('Результат скопирован в буфер обмена!');
      });
    } else {
      navigator.clipboard?.writeText(text);
      this.showNotification('Результат скопирован в буфер обмена!');
    }
  },
  
  // Показать уведомление
  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 30, 50, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 10000;
      animation: slideDown 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  },
  
  // Регистрация кастомных обработчиков
  onClick(callback) {
    this.handlers.click.push(callback);
  },
  
  onTouch(callback) {
    this.handlers.touch.push(callback);
  },
  
  onKeydown(callback) {
    this.handlers.keydown.push(callback);
  },
  
  onWheel(callback) {
    this.handlers.wheel.push(callback);
  },
  
  // Блокировка контекстного меню (ПКМ)
  disableContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
};

// Инициализируем ввод при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    GameInput.init();
  });
} else {
  GameInput.init();
}444444444