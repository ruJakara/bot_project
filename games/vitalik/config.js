const CONFIG = {
    tetris: {
        width: 10,
        height: 20,
        cellSize: 25,
        speed: 500,
        pieces: [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[0,1,1],[1,1,0]],
            [[1,1,0],[0,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]]
        ],
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fdcb6e']
    },
    
    minesweeper: {
        width: 9,
        height: 9,
        mines: 10
    },
    
    hangman: {
        words: ['ПРОГРАММИРОВАНИЕ','КОМПЬЮТЕР','ИГРОВОЙ','СБОРНИК','РАЗРАБОТКА','АЛГОРИТМ','ФУНКЦИЯ','ПЕРЕМЕННАЯ','ИНТЕРФЕЙС','КЛАВИАТУРА'],
        maxAttempts: 6
    },
    
    snake: {
        width: 20,
        height: 15,
        cellSize: 20,
        baseSpeed: 150,
        speedIncrease: 5,
        maxSpeed: 80
    },
    
    racing: {
        roadWidth: 500,
        roadHeight: 600,
        playerWidth: 60,
        playerHeight: 100,
        obstacleMinWidth: 40,
        obstacleMaxWidth: 70,
        obstacleMinHeight: 70,
        obstacleMaxHeight: 110,
        baseSpeed: 3,
        maxSpeed: 10,
        speedIncrease: 0.1,
        spawnRate: 800,
        difficultyIncrease: 10000
    },
    
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        difficulty: 'normal',
        background: 'default',
        musicType: 'piano'
    }
};

// Настройки сложности
CONFIG.difficultySettings = {
    easy: {
        tetris: { speed: 600 },
        minesweeper: { mines: 8 },
        snake: { baseSpeed: 180, speedIncrease: 3 },
        racing: { baseSpeed: 2, spawnRate: 1000 }
    },
    normal: {
        tetris: { speed: 500 },
        minesweeper: { mines: 10 },
        snake: { baseSpeed: 150, speedIncrease: 5 },
        racing: { baseSpeed: 3, spawnRate: 800 }
    },
    hard: {
        tetris: { speed: 400 },
        minesweeper: { mines: 12 },
        snake: { baseSpeed: 120, speedIncrease: 8 },
        racing: { baseSpeed: 4, spawnRate: 600 }
    }
};