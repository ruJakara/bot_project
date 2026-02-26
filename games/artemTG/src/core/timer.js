// Таймер игры (60 секунд)
const GameTimer = {
  duration: CONFIG.GAME.DURATION,
  remaining: CONFIG.GAME.DURATION,
  intervalId: null,
  callbacks: {
    tick: [],
    complete: []
  },
  
  init() {
    this.remaining = this.duration;
    console.log('⏱️ Таймер инициализирован');
  },
  
  start() {
    this.stop();
    this.remaining = this.duration;
    
    this.updateUI();
    
    this.intervalId = setInterval(() => {
      this.remaining--;
      
      // Обновить UI
      this.updateUI();
      
      // Вызвать коллбэки тика
      this.callbacks.tick.forEach(cb => cb(this.remaining));
      
      // Проверка завершения
      if (this.remaining <= 0) {
        this.stop();
        this.callbacks.complete.forEach(cb => cb());
      }
    }, 1000);
    
    console.log('⏱️ Таймер запущен');
  },
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },
  
  pause() {
    this.stop();
  },
  
  resume() {
    this.start();
  },
  
  reset() {
    this.stop();
    this.remaining = this.duration;
    this.updateUI();
  },
  
  updateUI() {
    const timerText = document.getElementById('timer-text');
    const timerBar = document.getElementById('timer-bar');
    
    if (timerText) {
      timerText.textContent = this.remaining;
    }
    
    if (timerBar) {
      const progress = (this.duration - this.remaining) / this.duration;
      timerBar.style.transform = `scaleX(${1 - progress})`;
    }
  },
  
  getTime() {
    return this.remaining;
  },
  
  onTick(callback) {
    this.callbacks.tick.push(callback);
  },
  
  onComplete(callback) {
    this.callbacks.complete.push(callback);
  },
  
  // Получить прогресс в процентах
  getProgress() {
    return ((this.duration - this.remaining) / this.duration) * 100;
  }
};