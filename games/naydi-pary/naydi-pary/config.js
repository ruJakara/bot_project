// config.js
const GAME_CONFIG = {
    // Все доступные стихии (символы)
    elements: [
        { name: 'fire', symbol: '🔥' },
        { name: 'water', symbol: '💧' },
        { name: 'air', symbol: '🌪️' },
        { name: 'earth', symbol: '🪨' },
        { name: 'light', symbol: '✨' },
        { name: 'dark', symbol: '🌑' },
        { name: 'thunder', symbol: '⚡' },
        { name: 'ice', symbol: '❄️' },
        { name: 'nature', symbol: '🌿' },
        { name: 'crystal', symbol: '💎' },
        { name: 'void', symbol: '🌀' },
        { name: 'spirit', symbol: '👻' }
    ],
    
    // 15 уровней с прогрессией
    levels: [
        { id: 1, pairs: 3, name: 'Врата', description: '3 пары' },      // 6 карт
        { id: 2, pairs: 4, name: 'Преддверие', description: '4 пары' },  // 8 карт
        { id: 3, pairs: 5, name: 'Зал теней', description: '5 пар' },    // 10 карт
        { id: 4, pairs: 6, name: 'Комната ветров', description: '6 пар' }, // 12 карт
        { id: 5, pairs: 7, name: 'Зеркальный зал', description: '7 пар' }, // 14 карт
        { id: 6, pairs: 8, name: 'Чертог огня', description: '8 пар' },   // 16 карт
        { id: 7, pairs: 9, name: 'Водопад душ', description: '9 пар' },   // 18 карт
        { id: 8, pairs: 10, name: 'Лес призраков', description: '10 пар' }, // 20 карт
        { id: 9, pairs: 11, name: 'Зал кристаллов', description: '11 пар' }, // 22 карт
        { id: 10, pairs: 12, name: 'Лабиринт теней', description: '12 пар' }, // 24 карт
        { id: 11, pairs: 13, name: 'Склеп времени', description: '13 пар' }, // 26 карт
        { id: 12, pairs: 14, name: 'Зеркало судьбы', description: '14 пар' }, // 28 карт
        { id: 13, pairs: 15, name: 'Зал стихий', description: '15 пар' }, // 30 карт
        { id: 14, pairs: 16, name: 'Сердце храма', description: '16 пар' }, // 32 карт
        { id: 15, pairs: 18, name: 'Алтарь богов', description: '18 пар' } // 36 карт - финальный
    ],
    
    flipDelay: 300,
    matchCheckDelay: 700
};

// Прогресс игрока (сохраняется в localStorage)
let gameProgress = {
    currentLevel: 1,
    completedLevels: []
};

// DOM элементы
let DOM = {
    // Меню
    menuScreen: null,
    gameScreen: null,
    levelGrid: null,
    completedLevelsSpan: null,
    resetProgressBtn: null,
    backToMenuBtn: null,
    transitionOverlay: null,
    
    // Игра
    board: null,
    movesSpan: null,
    pairsSpan: null,
    levelIndicator: null,
    restartLevelBtn: null,
    nextLevelBtn: null
};

// Загрузка прогресса из localStorage
function loadProgress() {
    try {
        const saved = localStorage.getItem('templeProgress');
        if (saved) {
            gameProgress = JSON.parse(saved);
        } else {
            // По умолчанию только 1 уровень доступен
            gameProgress = { currentLevel: 1, completedLevels: [] };
        }
    } catch (e) {
        console.log('Ошибка загрузки прогресса');
        gameProgress = { currentLevel: 1, completedLevels: [] };
    }
}

// Сохранение прогресса
function saveProgress() {
    localStorage.setItem('templeProgress', JSON.stringify(gameProgress));
}

// Сброс прогресса
function resetProgress() {
    gameProgress = { currentLevel: 1, completedLevels: [] };
    saveProgress();
}