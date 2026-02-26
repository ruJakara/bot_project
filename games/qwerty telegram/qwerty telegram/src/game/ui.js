// Управление UI

class UIManager {
    constructor() {
        this.elements = {};
        this.isInitialized = false;
    }
    
    // Инициализация UI (вызывать после загрузки DOM)
    init() {
        if (this.isInitialized) return;
        
        this.elements = {
            score: document.getElementById('score-value'),
            timer: document.getElementById('timer-value'),
            bestScore: document.getElementById('best-score'),
            resultScore: document.getElementById('result-score'),
            resultAttempts: document.getElementById('result-attempts'),
            resultAccuracy: document.getElementById('result-accuracy'),
            resultRecord: document.getElementById('result-new-record'),
            btnStart: document.getElementById('btn-start'),
            btnReplay: document.getElementById('btn-replay'),
            btnShare: document.getElementById('btn-share')
        };
        
        console.log('UI Elements:', this.elements);
        
        // Кнопка старта
        if (this.elements.btnStart) {
            const startHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎮 Кнопка НАЧАТЬ нажата');
                scenes.showPlay();
            };
            this.elements.btnStart.addEventListener('click', startHandler);
            this.elements.btnStart.addEventListener('touchend', startHandler, { passive: false });
            this.elements.btnStart.addEventListener('pointerup', startHandler);
            
            // Также добавляем через глобальный input для надёжности
            input.onClick((e) => {
                if (e.target === this.elements.btnStart) {
                    scenes.showPlay();
                }
            });
        }
        
        // Кнопка повтора
        if (this.elements.btnReplay) {
            const replayHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startNewGame();
            };
            this.elements.btnReplay.addEventListener('click', replayHandler);
            this.elements.btnReplay.addEventListener('touchend', replayHandler, { passive: false });
            this.elements.btnReplay.addEventListener('pointerup', replayHandler);
        }
        
        // Кнопка поделиться
        if (this.elements.btnShare) {
            const shareHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.shareResult();
            };
            this.elements.btnShare.addEventListener('click', shareHandler);
            this.elements.btnShare.addEventListener('touchend', shareHandler, { passive: false });
            this.elements.btnShare.addEventListener('pointerup', shareHandler);
        }
        
        // Обновляем лучший счёт
        this.updateBestScore();
        
        this.isInitialized = true;
        console.log('✅ UI инициализирован');
    }
    
    // Обновление счёта
    updateScore() {
        if (this.elements.score) {
            this.elements.score.textContent = gameState.score;
        }
    }
    
    // Обновление таймера
    updateTimer(time) {
        if (this.elements.timer) {
            this.elements.timer.textContent = time;
            
            // Предупреждение о мало времени
            if (time <= GAME_CONFIG.TIMER_WARNING) {
                this.elements.timer.classList.add('low');
            } else {
                this.elements.timer.classList.remove('low');
            }
        }
    }
    
    // Обновление лучшего счёта
    updateBestScore() {
        const bestScore = storage.getBestScore();
        if (this.elements.bestScore && bestScore > 0) {
            this.elements.bestScore.textContent = `Лучший результат: ${bestScore} ⚽`;
        }
    }
    
    // Показ результата
    showResult() {
        const stats = gameState.getStats();
        const isNewRecord = storage.updateBestScore(stats.score);
        storage.updateStats(stats.goals, stats.attempts);
        
        if (this.elements.resultScore) {
            this.elements.resultScore.textContent = stats.score;
        }
        
        if (this.elements.resultAttempts) {
            this.elements.resultAttempts.textContent = stats.attempts;
        }
        
        if (this.elements.resultAccuracy) {
            this.elements.resultAccuracy.textContent = `${stats.accuracy}%`;
        }
        
        if (this.elements.resultRecord) {
            if (isNewRecord) {
                this.elements.resultRecord.textContent = '🏆 НОВЫЙ РЕКОРД!';
            } else {
                this.elements.resultRecord.textContent = '';
            }
        }
        
        // Обновляем лучший счёт в UI
        this.updateBestScore();
    }
    
    // Начало новой игры
    startNewGame() {
        gameState.reset();
        gameRules.reset();
        scenes.showPlay();
    }
    
    // Поделиться результатом
    shareResult() {
        const score = gameState.score;
        TelegramAPI.shareScore(score);
    }
    
    // Показ сообщения
    showMessage(message, duration = 2000) {
        console.log(message);
    }
}

// Экземпляр менеджера UI
const ui = new UIManager();
