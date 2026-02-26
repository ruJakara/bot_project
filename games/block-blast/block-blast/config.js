// Конфигурация игры
const CONFIG = {
    game: {
        gridSize: 10,
        cellSize: 50,
        colors: [
            '#FF6B6B', // Красный
            '#4ECDC4', // Бирюзовый
            '#45B7D1', // Голубой
            '#96CEB4', // Мятный
            '#FFD700', // Золотой
            '#FF9F1C'  // Оранжевый
        ]
    },
    
    blocks: [
        // 1 клетка
        { shape: [[1]], score: 20 },     // Было 10
        
        // 2 клетки
        { shape: [[1, 1]], score: 40 },   // Было 20
        { shape: [[1], [1]], score: 40 },  // Было 20
        
        // 3 клетки
        { shape: [[1, 1, 1]], score: 60 }, // Было 30
        { shape: [[1], [1], [1]], score: 60 },
        { shape: [[1, 1], [1, 0]], score: 60 },
        { shape: [[1, 1], [0, 1]], score: 60 },
        { shape: [[0, 1], [1, 1]], score: 60 },
        { shape: [[1, 0], [1, 1]], score: 60 },
        
        // 4 клетки
        { shape: [[1, 1], [1, 1]], score: 80 },  // Было 40
        { shape: [[1, 1, 1], [1, 0, 0]], score: 80 },
        { shape: [[1, 1, 1], [0, 0, 1]], score: 80 },
        { shape: [[1, 1, 0], [0, 1, 1]], score: 80 },
        { shape: [[0, 1, 1], [1, 1, 0]], score: 80 },
        
        // 5 клеток
        { shape: [[1, 1, 1], [1, 0, 1]], score: 100 }, // Было 50
        { shape: [[1, 1], [1, 1], [1, 0]], score: 100 },
        { shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]], score: 100 }
    ],
    
    // Увеличенные бонусы за линии
    lineBonus: [200, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000] // Все значения удвоены
};

// Состояние игры
let gameState = {
    currentScreen: 'menu',
    score: 0,
    highScore: 0,
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 70,
    sfxVolume: 80,
    animationSpeed: 1,
    records: [0, 0, 0]
};

// Загрузка сохранений
function loadGameState() {
    const saved = localStorage.getItem('blockBlast');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.records = data.records || [0, 0, 0];
            gameState.highScore = gameState.records[0] || 0;
            gameState.musicVolume = data.musicVolume || 70;
            gameState.sfxVolume = data.sfxVolume || 80;
            gameState.animationSpeed = data.animationSpeed || 1;
        } catch (e) {
            console.log('Error loading saves');
        }
    }
}

// Сохранение
function saveGameState() {
    localStorage.setItem('blockBlast', JSON.stringify({
        records: gameState.records,
        musicVolume: gameState.musicVolume,
        sfxVolume: gameState.sfxVolume,
        animationSpeed: gameState.animationSpeed
    }));
}

// Создание фоновых частиц
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 10 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = 15 + Math.random() * 20 + 's';
        particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        container.appendChild(particle);
    }
}

// Запускаем частицы
createParticles();
loadGameState();