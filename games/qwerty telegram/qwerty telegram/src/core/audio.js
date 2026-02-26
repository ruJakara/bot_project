// Менеджер аудио

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.isInitialized = false;
        
        // Событие для разблокировки аудио (первый клик)
        document.addEventListener('click', this.unlockAudio.bind(this), { once: true });
        document.addEventListener('touchstart', this.unlockAudio.bind(this), { once: true });
    }
    
    // Разблокировка аудио (браузеры требуют этого)
    unlockAudio() {
        if (this.isInitialized) return;
        
        // Создаём тихий звук для инициализации контекста
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.value = 0;
        oscillator.start();
        oscillator.stop(0.1);
        
        this.isInitialized = true;
        console.log('Audio unlocked');
    }
    
    // Загрузка звука
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.volume = this.volume;
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(name, audio);
                resolve();
            });
            
            audio.addEventListener('error', reject);
        });
    }
    
    // Загрузка нескольких звуков
    async loadSounds(soundMap) {
        const promises = [];
        for (const [name, url] of Object.entries(soundMap)) {
            promises.push(this.loadSound(name, url));
        }
        await Promise.all(promises);
    }
    
    // Воспроизведение звука
    play(name, volume = null) {
        if (this.isMuted || !this.isInitialized) return;
        
        const audio = this.sounds.get(name);
        if (!audio) {
            console.warn(`Sound "${name}" not found`);
            return;
        }
        
        // Клонируем для возможности одновременного воспроизведения
        const clone = audio.cloneNode();
        clone.volume = volume !== null ? volume : this.volume;
        clone.play().catch(e => console.warn('Audio play failed:', e));
    }
    
    // Воспроизведение музыки (циклично)
    playMusic(url) {
        if (this.music) {
            this.music.pause();
        }
        
        this.music = new Audio(url);
        this.music.volume = this.volume * 0.3; // музыка тише
        this.music.loop = true;
        
        if (this.isInitialized && !this.isMuted) {
            this.music.play().catch(e => console.warn('Music play failed:', e));
        }
    }
    
    // Остановка музыки
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }
    
    // Переключение звука
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.music) {
            this.music.muted = this.isMuted;
        }
        
        return this.isMuted;
    }
    
    // Установка громкости
    setVolume(volume) {
        this.volume = Utils.clamp(volume, 0, 1);
        
        // Обновляем громкость всех загруженных звуков
        this.sounds.forEach(audio => {
            audio.volume = this.volume;
        });
        
        if (this.music) {
            this.music.volume = this.volume * 0.3;
        }
    }
    
    // Проверка, загружен ли звук
    hasSound(name) {
        return this.sounds.has(name);
    }
}

// Экземпляр менеджера аудио
const audio = new AudioManager();