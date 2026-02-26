// Таймер обратного отсчёта

class GameTimer {
    constructor(duration) {
        this.duration = duration; // в секундах
        this.remaining = duration;
        this.isRunning = false;
        this.onTick = null; // callback при каждом тике
        this.onEnd = null; // callback при окончании
        this.tickInterval = null;
    }
    
    // Запуск таймера
    start() {
        if (this.isRunning) return;
        
        this.remaining = this.duration;
        this.isRunning = true;
        
        // Первый тик сразу
        if (this.onTick) {
            this.onTick(this.remaining);
        }
        
        // Тики каждую секунду
        this.tickInterval = setInterval(() => {
            this.remaining--;
            
            if (this.onTick) {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onEnd) {
                    this.onEnd();
                }
            }
        }, 1000);
    }
    
    // Остановка таймера
    stop() {
        this.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }
    
    // Пауза таймера
    pause() {
        this.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }
    
    // Возобновление таймера
    resume() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.tickInterval = setInterval(() => {
            this.remaining--;
            
            if (this.onTick) {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onEnd) {
                    this.onEnd();
                }
            }
        }, 1000);
    }
    
    // Сброс таймера
    reset(duration = null) {
        this.stop();
        if (duration !== null) {
            this.duration = duration;
        }
        this.remaining = this.duration;
    }
    
    // Получение оставшегося времени
    getRemaining() {
        return this.remaining;
    }
    
    // Проверка, идёт ли таймер
    isRunning() {
        return this.isRunning;
    }
}