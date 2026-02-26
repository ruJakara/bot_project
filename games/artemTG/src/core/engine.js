// Главный игровой движок
const GameEngine = {
  running: false,
  lastTime: 0,
  deltaTime: 0,
  fps: 0,
  frameCount: 0,
  lastFpsUpdate: 0,
  
  init() {
    console.log('⚙️ Движок инициализирован');
  },
  
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    
    this.gameLoop();
    
    console.log('▶️ Движок запущен');
  },
  
  stop() {
    this.running = false;
    console.log('⏹️ Движок остановлен');
  },
  
  gameLoop(timestamp) {
    if (!this.running) return;
    
    // Вычисление deltaTime
    this.deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Обновление FPS
    this.frameCount++;
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }
    
    // Обновление игры
    this.update();
    
    // Рендеринг
    this.render();
    
    // Следующий кадр
    requestAnimationFrame(this.gameLoop.bind(this));
  },
  
  update() {
    // Обновление состояния игры (если нужно)
    // Пока основная логика в таймере и обработчиках событий
  },
  
  render() {
    // Рендеринг уже происходит через DOM манипуляции
    // Здесь можно добавить анимации или эффекты
  },
  
  getFPS() {
    return this.fps;
  },
  
  isRunning() {
    return this.running;
  }
};