// Состояние игры

class GameState {
    constructor() {
        this.reset();
    }
    
    // Сброс состояния
    reset() {
        this.score = 0;
        this.attempts = 0;
        this.goals = 0;
        this.saves = 0;
        this.recentShots = []; // последние удары для ИИ вратаря
        this.isBallReady = true;
        this.currentShotZone = null;
        this.goalkeeperLastJump = null;
        this.gameActive = false;
    }
    
    // Регистрация удара
    registerShot(zone) {
        this.attempts++;
        this.currentShotZone = zone;
        this.isBallReady = false;
        
        // Сохраняем зону для ИИ
        this.recentShots.push(zone);
        if (this.recentShots.length > GAME_CONFIG.MAX_RECENT_SHOTS) {
            this.recentShots.shift();
        }
    }
    
    // Регистрация гола
    registerGoal() {
        this.score += GAME_CONFIG.POINTS_PER_GOAL;
        this.goals++;
        this.isBallReady = true;
    }
    
    // Регистрация сэйва
    registerSave() {
        this.saves++;
        this.isBallReady = true;
    }
    
    // Получение точности
    getAccuracy() {
        if (this.attempts === 0) return 0;
        return Utils.percentage(this.goals, this.attempts);
    }
    
    // Получение статистики
    getStats() {
        return {
            score: this.score,
            attempts: this.attempts,
            goals: this.goals,
            saves: this.saves,
            accuracy: this.getAccuracy()
        };
    }
    
    // Проверка, готов ли мяч к удару
    isReady() {
        return this.isBallReady;
    }
    
    // Активация игры
    activate() {
        this.gameActive = true;
    }
    
    // Деактивация игры
    deactivate() {
        this.gameActive = false;
    }
    
    // Проверка, активна ли игра
    isActive() {
        return this.gameActive;
    }
}

// Экземпляр состояния игры
const gameState = new GameState();