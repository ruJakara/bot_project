// Структура уровней с правильной маджонг-расстановкой
const LEVELS = [
    {
        id: 1,
        name: "Новичок",
        layout: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ],
        tileTypes: ['dragon', 'phoenix', 'mountain'],
        tileCounts: { dragon: 4, phoenix: 4, mountain: 4 },
        symbols: {
            dragon: '龍',
            phoenix: '鳳',
            mountain: '山'
        },
        duration: 60,
        description: "Классический маджонг: соединяйте доступные плитки"
    },
    {
        id: 2,
        name: "Любитель",
        layout: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ],
        tileTypes: ['dragon', 'phoenix', 'mountain', 'fire'],
        tileCounts: { dragon: 4, phoenix: 4, mountain: 4, fire: 4 },
        symbols: {
            dragon: '龍',
            phoenix: '鳳',
            mountain: '山',
            fire: '火'
        },
        duration: 55,
        description: "Больше уровней и новых символов"
    },
    {
        id: 3,
        name: "Мастер",
        layout: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ],
        tileTypes: ['dragon', 'phoenix', 'mountain', 'fire', 'water'],
        tileCounts: { dragon: 4, phoenix: 4, mountain: 4, fire: 4, water: 4 },
        symbols: {
            dragon: '龍',
            phoenix: '鳳',
            mountain: '山',
            fire: '火',
            water: '水'
        },
        duration: 50,
        description: "Сложная расстановка для настоящих мастеров"
    }
];

// Общие настройки
const GAME_CONFIG = {
    TOTAL_LEVELS: LEVELS.length,
    ANIMATION_SPEED: 300,
    PENALTY_SECONDS: 5,
    MAX_PENALTIES: 3,
    TILE_SIZE: 70,
    LAYER_SPACING: 15,
    MAX_GENERATION_ATTEMPTS: 10,
    LAYER_INDICATOR: false // Убраны индикаторы глубины
};

// Инициализация структуры маджонга
function initMahjonggLayout(levelIndex) {
    const layout = LEVELS[levelIndex].layout;
    const rows = layout.length;
    const cols = layout[0].length;
    
    // Создаем пирамидальную структуру
    for (let row = 0; row < rows; row++) {
        const rowLength = cols;
        const offset = Math.floor((rows - 1 - row) / 2);
        
        for (let col = 0; col < rowLength; col++) {
            // Определяем, будет ли здесь плитка
            const isTile = (col >= offset && col < rowLength - offset);
            layout[row][col] = isTile ? 1 : 0;
        }
    }
    
    return layout;
}