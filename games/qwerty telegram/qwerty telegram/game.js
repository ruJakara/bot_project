// Точка входа в игру

// Флаг инициализации
let isInitialized = false;

// Инициализация игры
function initGame() {
    if (isInitialized) return;
    
    console.log('🎮 Инициализация игры...');
    
    // Инициализируем компоненты в правильном порядке
    scenes.init();
    ui.init();
    
    // Показываем стартовую сцену
    scenes.showStart();
    
    // Загружаем аудио (асинхронно)
    loadAudio().catch(err => {
        console.warn('Не удалось загрузить аудио:', err);
    });
    
    isInitialized = true;
    console.log('✅ Игра готова!');
}

// Загрузка аудио
async function loadAudio() {
    const silentWav =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
    const sounds = {
        kick: silentWav,
        goal: silentWav,
        save: silentWav,
        start: silentWav,
        end: silentWav
    };
    
    try {
        await audio.loadSounds(sounds);
        console.log('🔊 Аудио загружено');
    } catch (err) {
        console.warn('Ошибка загрузки аудио:', err);
    }
}

// Запуск игры при полной загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен');
    initGame();
});

// Резервный вариант
window.addEventListener('load', () => {
    if (!isInitialized) {
        initGame();
    }
});

// Обработка видимости страницы (пауза/возобновление)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Страница скрыта - ставим на паузу
        if (scenes.isPlaying() && scenes.timer && scenes.timer.isRunning) {
            scenes.timer.pause();
        }
    } else {
        // Страница снова видна - возобновляем
        if (scenes.isPlaying() && scenes.timer && !scenes.timer.isRunning) {
            scenes.timer.resume();
        }
    }
});

// Обработка потери фокуса окна
window.addEventListener('blur', () => {
    if (scenes.isPlaying() && scenes.timer && scenes.timer.isRunning) {
        scenes.timer.pause();
    }
});

window.addEventListener('focus', () => {
    if (scenes.isPlaying() && scenes.timer && !scenes.timer.isRunning) {
        scenes.timer.resume();
    }
});

console.log('⚽ Пенальти - Мини-игра для Telegram');
