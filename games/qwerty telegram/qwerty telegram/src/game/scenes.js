// Управление сценами

class SceneManager {
    constructor() {
        this.scenes = {};
        this.currentScene = null;
        this.timer = null;
        this.isInitialized = false;
    }
    
    // Инициализация (вызывать после загрузки DOM)
    init() {
        if (this.isInitialized) return;
        
        this.scenes = {
            start: document.getElementById('scene-start'),
            play: document.getElementById('scene-play'),
            result: document.getElementById('scene-result')
        };
        
        this.timer = new GameTimer(GAME_CONFIG.DURATION);
        
        // Настройка таймера
        this.timer.onTick = (remaining) => {
            ui.updateTimer(remaining);
        };
        
        this.timer.onEnd = () => {
            this.showResult();
        };
        
        this.isInitialized = true;
        console.log('✅ Scenes инициализированы');
    }
    
    // Показ сцены старта
    showStart() {
        if (!this.isInitialized) this.init();
        
        this.hideAll();
        if (this.scenes.start) {
            this.scenes.start.classList.add('active');
        }
        this.currentScene = 'start';
        
        // Останавливаем таймер если он работал
        if (this.timer) {
            this.timer.stop();
        }
    }
    
    // Показ игровой сцены
    showPlay() {
        if (!this.isInitialized) this.init();
        
        console.log('▶️ Начинаем игру...');
        
        this.hideAll();
        if (this.scenes.play) {
            this.scenes.play.classList.add('active');
        }
        this.currentScene = 'play';
        
        // Инициализируем сущности
        if (!entities.isInitialized) {
            entities.init();
        }
        
        // Активируем игру
        gameState.activate();
        gameRules.prepareNewAttempt();
        
        // Запускаем таймер
        if (this.timer) {
            this.timer.start();
        }
        
        // Воспроизводим звук начала игры
        if (audio.hasSound('start')) {
            audio.play('start', 0.5);
        }
        
        // Расширяем окно в Telegram
        TelegramAPI.expand();
        
        console.log('✅ Игра запущена');
    }
    
    // Показ сцены результата
    showResult() {
        if (!this.isInitialized) this.init();
        
        // Завершаем игру
        gameRules.endGame();
        
        this.hideAll();
        if (this.scenes.result) {
            this.scenes.result.classList.add('active');
        }
        this.currentScene = 'result';
        
        // Показываем результат
        if (ui.isInitialized) {
            ui.showResult();
        }
        
        // Звук конца игры
        if (audio.hasSound('end')) {
            audio.play('end', 0.5);
        }
        
        console.log('🏁 Игра завершена');
    }
    
    // Скрытие всех сцен
    hideAll() {
        Object.values(this.scenes).forEach(scene => {
            if (scene) {
                scene.classList.remove('active');
            }
        });
    }
    
    // Получение текущей сцены
    getCurrentScene() {
        return this.currentScene;
    }
    
    // Проверка, активна ли игровая сцена
    isPlaying() {
        return this.currentScene === 'play';
    }
}

// Экземпляр менеджера сцен
const scenes = new SceneManager();
