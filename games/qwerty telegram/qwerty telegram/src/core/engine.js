// Главный игровой движок

class GameEngine {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulated = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Коллбэки
        this.updateCallbacks = [];
        this.renderCallbacks = [];
    }
    
    // Запуск игрового цикла
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastFpsUpdate = this.lastTime;
        this.frameCount = 0;
        
        this.gameLoop();
    }
    
    // Остановка игрового цикла
    stop() {
        this.isRunning = false;
    }
    
    // Главный игровой цикл
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // Вычисляем дельту времени
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.deltaTime = delta / 1000; // в секундах
        
        // Обновляем FPS
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
        
        // Вызываем все функции обновления
        this.updateCallbacks.forEach(callback => callback(this.deltaTime));
        
        // Вызываем все функции рендера
        this.renderCallbacks.forEach(callback => callback());
        
        // Рекурсивный вызов
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Добавление функции обновления
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
    
    // Добавление функции рендера
    onRender(callback) {
        this.renderCallbacks.push(callback);
    }
    
    // Удаление функции обновления
    removeUpdate(callback) {
        this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    }
    
    // Удаление функции рендера
    removeRender(callback) {
        this.renderCallbacks = this.renderCallbacks.filter(cb => cb !== callback);
    }
    
    // Получение текущего FPS
    getFPS() {
        return this.fps;
    }
}

// Экземпляр движка
const engine = new GameEngine();