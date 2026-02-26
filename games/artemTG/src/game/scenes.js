// Управление сценами игры
const GameScenes = {
  currentScene: null,
  
  init() {
    console.log('🎭 Сцены инициализированы');
  },
  
  // Показать сцену
  showScene(sceneName) {
    // Скрыть текущую сцену
    if (this.currentScene) {
      const oldScene = document.getElementById(this.currentScene);
      if (oldScene) {
        oldScene.classList.remove('active');
      }
    }
    
    // Показать новую сцену
    const newScene = document.getElementById(sceneName);
    if (newScene) {
      // Небольшая задержка для плавности
      setTimeout(() => {
        newScene.classList.add('active');
        this.currentScene = sceneName;
        
        // Специальная логика для сцен
        this.onSceneChange(sceneName);
      }, 10);
    }
  },
  
  // Обработчик смены сцены
  onSceneChange(sceneName) {
    switch (sceneName) {
      case CONFIG.SCENES.START:
        this.onStartScene();
        break;
      case CONFIG.SCENES.GAME:
        this.onGameScene();
        break;
      case CONFIG.SCENES.RESULT:
        this.onResultScene();
        break;
    }
  },
  
  onStartScene() {
    console.log('🏠 Сцена: Старт');
    
    // Обновить лучший результат
    if (window.Game?.ui) {
      GameUI.updateBestScore();
    }
  },
  
  onGameScene() {
    console.log('🎮 Сцена: Игра');
    
    // Сбросить таймер UI
    const timerBar = document.getElementById('timer-bar');
    if (timerBar) {
      timerBar.style.transform = 'scaleX(1)';
    }
    
    // Обновить ресурсы
    if (window.Game?.ui) {
      GameUI.updateResources();
    }
    
    // Показать первое событие
    setTimeout(() => {
      if (window.Game?.state) {
        GameState.showEvent();
      }
    }, 300);
  },
  
  onResultScene() {
    console.log('🏆 Сцена: Результат');
    
    // Обновить лучший результат
    if (window.Game?.ui) {
      GameUI.updateBestScore();
    }
  },
  
  // Получить текущую сцену
  getCurrentScene() {
    return this.currentScene;
  },
  
  // Проверка активной сцены
  isSceneActive(sceneName) {
    return this.currentScene === sceneName;
  },
  
  // Скрыть сцену
  hideScene(sceneName) {
    const scene = document.getElementById(sceneName);
    if (scene) {
      scene.classList.remove('active');
    }
  },
  
  // Переключение сцены
  switchScene(from, to) {
    this.hideScene(from);
    this.showScene(to);
  }
};