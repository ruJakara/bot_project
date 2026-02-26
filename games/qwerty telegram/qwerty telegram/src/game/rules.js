// Правила игры и логика

class GameRules {
    constructor() {
        this.goalkeeperJumpTimeout = null;
        this.ballResetTimeout = null;
        this.currentAllowedZones = new Set();
    }
    
    // Подготовка следующей попытки (выбираем 3 проходные зоны заранее)
    prepareNewAttempt() {
        this.currentAllowedZones = this.generateAllowedZones();
        if (entities && entities.isInitialized) {
            entities.flashAllowedZones(this.currentAllowedZones);
        }
    }
    
    // Обработка удара по зоне
    processShot(zone) {
        if (!gameState.isReady() || !gameState.isActive()) return;
        
        // Регистрируем удар
        gameState.registerShot(zone);
        
        // Воспроизводим звук удара
        if (audio.hasSound('kick')) {
            audio.play('kick', 0.6);
        }
        
        // Анимируем удар мяча
        this.animateBallShot(zone);
        
        // Вратарь прыгает с задержкой
        clearTimeout(this.goalkeeperJumpTimeout);
        this.goalkeeperJumpTimeout = setTimeout(() => {
            // Проверяем результат через время полёта мяча
            setTimeout(() => {
                this.checkResult(zone);
            }, GAME_CONFIG.BALL_SHOOT_DURATION / 2);
        }, GAME_CONFIG.GOALKEEPER_JUMP_DELAY);
    }
    
    // Генерация 3 зон, куда мяч проходит
    generateAllowedZones() {
        const shuffled = Utils.shuffle(GAME_CONFIG.ZONES);
        return new Set(shuffled.slice(0, 3));
    }
    
    // Анимация удара мяча
    animateBallShot(zone) {
        const ball = document.getElementById('ball');
        if (!ball) return;
        
        // Добавляем класс для анимации
        ball.className = 'ball shoot';
        
        // Через время сбрасываем анимацию
        clearTimeout(this.ballResetTimeout);
        this.ballResetTimeout = setTimeout(() => {
            ball.className = 'ball';
        }, GAME_CONFIG.BALL_SHOOT_DURATION);
    }
    
    // Анимация прыжка вратаря
    animateGoalkeeperJump(zone) {
        const goalkeeper = document.getElementById('goalkeeper');
        if (!goalkeeper) return;
        
        // Убираем предыдущие классы
        goalkeeper.className = 'goalkeeper';
        
        // Добавляем класс прыжка
        setTimeout(() => {
            goalkeeper.classList.add(`jump-${zone}`);
        }, 10);
        
        // Возвращаем вратаря на место
        setTimeout(() => {
            goalkeeper.className = 'goalkeeper';
        }, GAME_CONFIG.GOALKEEPER_JUMP_DURATION + GAME_CONFIG.GOALKEEPER_RESET_DELAY);
    }
    
    // Проверка результата удара
    checkResult(playerZone) {
        const ball = document.getElementById('ball');
        if (!ball) return;
        
        const isGoal = this.currentAllowedZones.has(playerZone);
        
        // Визуально: если гол, вратарь прыгает в "плохую" зону, иначе в зону удара
        if (isGoal) {
            const deniedZones = GAME_CONFIG.ZONES.filter(z => !this.currentAllowedZones.has(z));
            const jumpZone = deniedZones.length ? Utils.randomChoice(deniedZones) : Utils.randomChoice(GAME_CONFIG.ZONES);
            this.animateGoalkeeperJump(jumpZone);
        } else {
            this.animateGoalkeeperJump(playerZone);
        }
        
        if (isGoal) {
            // ГОЛ!
            gameState.registerGoal();
            
            // Анимация гола
            ball.className = 'ball goal';
            
            // Звук гола
            if (audio.hasSound('goal')) {
                audio.play('goal', 0.8);
            }
            
            // Вибрация (если поддерживается)
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        } else {
            // СЭЙВ!
            gameState.registerSave();
            
            // Анимация сэйва
            ball.className = 'ball save';
            
            // Звук сэйва
            if (audio.hasSound('save')) {
                audio.play('save', 0.5);
            }
            
            // Вибрация
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }
        
        // Обновляем UI
        ui.updateScore();
        
        // Сбрасываем мяч через задержку
        setTimeout(() => {
            ball.className = 'ball';
            gameState.isBallReady = true;
            if (gameState.isActive()) {
                this.prepareNewAttempt();
            }
        }, GAME_CONFIG.BALL_RESET_DELAY);
    }
    
    // Завершение игры
    endGame() {
        gameState.deactivate();
        clearTimeout(this.goalkeeperJumpTimeout);
        clearTimeout(this.ballResetTimeout);
        this.currentAllowedZones = new Set();
    }
    
    // Сброс правил
    reset() {
        this.endGame();
    }
}

// Экземпляр правил игры
const gameRules = new GameRules();
