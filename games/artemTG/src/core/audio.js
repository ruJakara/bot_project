// Аудио система
const GameAudio = {
  enabled: true,
  sounds: {},
  music: null,
  
  init() {
    // Загрузка звуков
    this.loadSounds();
    
    // Проверка настроек
    const settings = Storage.getSettings();
    this.enabled = settings.sound !== false;
    
    // Разблокировка аудио по первому клику
    this.unlockAudio();
    
    console.log('🔊 Аудио инициализировано');
  },
  
  loadSounds() {
    // Создание звуковых эффектов через Web Audio API (легче, чем файлы)
    this.createClickSound();
    this.createEventSound();
    this.createWinSound();
    this.createLoseSound();
  },
  
  // Создание звуков через Web Audio API
  createClickSound() {
    this.sounds.click = () => {
      if (!this.enabled) return;
      
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.value = 0.1;
        
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {
        console.log('🔇 Web Audio не поддерживается');
      }
    };
  },
  
  createEventSound() {
    this.sounds.event = () => {
      if (!this.enabled) return;
      
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        console.log('🔇 Web Audio не поддерживается');
      }
    };
  },
  
  createWinSound() {
    this.sounds.win = () => {
      if (!this.enabled) return;
      
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        [400, 500, 600, 700].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.08;
          
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.1);
        });
      } catch (e) {
        console.log('🔇 Web Audio не поддерживается');
      }
    };
  },
  
  createLoseSound() {
    this.sounds.lose = () => {
      if (!this.enabled) return;
      
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log('🔇 Web Audio не поддерживается');
      }
    };
  },
  
  // Разблокировка аудио (требуется для мобильных)
  unlockAudio() {
    const unlock = () => {
      if (window.AudioContext || window.webkitAudioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume();
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
      }
    };
    
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  },
  
  // Воспроизведение звука
  play(soundName) {
    if (!this.enabled) return;
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  },
  
  // Включение/выключение звука
  toggle() {
    this.enabled = !this.enabled;
    Storage.saveSettings({ ...Storage.getSettings(), sound: this.enabled });
  },
  
  isEnabled() {
    return this.enabled;
  }
};