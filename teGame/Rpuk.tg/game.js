document.addEventListener('DOMContentLoaded', () => {
    // Состояние игры
    const gameState = {
        currentLevelIndex: 0,
        totalScore: 0,
        totalTimeUsed: 0,
        totalPairsFound: 0,
        totalPenalties: 0,
        levelResults: [],
        gameActive: false,
        timerInterval: null,
        board: [],
        layout: [],
        firstSelected: null,
        pairsFound: {},
        penalties: 0,
        currentLevel: null,
        isGameOver: false
    };

    // DOM элементы
    const elements = {
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        resultScreen: document.getElementById('result-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        gameBoard: document.getElementById('game-board'),
        timerDisplay: document.getElementById('timer'),
        scoreDisplay: document.getElementById('score'),
        currentLevelDisplay: document.getElementById('current-level'),
        selectionStatus: document.getElementById('selection-status'),
        levelDescription: document.getElementById('level-description'),
        totalScoreDisplay: document.getElementById('total-score'),
        totalPairsDisplay: document.getElementById('total-pairs'),
        totalTimeDisplay: document.getElementById('total-time'),
        levelResultsContainer: document.getElementById('level-results-container'),
        restartButton: document.getElementById('restart-button'),
        gameOverRestartButton: document.getElementById('game-over-restart-button')
    };

    // Инициализация текущего уровня
    function initCurrentLevel() {
        gameState.currentLevel = LEVELS[gameState.currentLevelIndex];
        gameState.layout = initMahjonggLayout(gameState.currentLevelIndex);
        gameState.pairsFound = {};
        gameState.penalties = 0;
        gameState.isGameOver = false;
        
        // Инициализация счетчиков пар для текущего уровня
        gameState.currentLevel.tileTypes.forEach(type => {
            gameState.pairsFound[type] = 0;
        });
        
        // Обновление интерфейса
        elements.currentLevelDisplay.textContent = gameState.currentLevel.id;
        elements.levelDescription.textContent = gameState.currentLevel.description;
        
        // Инициализация игрового поля
        initGameBoard();
    }

    // Инициализация игрового поля для текущего уровня
    function initGameBoard(attempt = 0) {
        elements.gameBoard.innerHTML = '';
        gameState.board = Array(gameState.currentLevel.layout.length).fill().map(() => 
            Array(gameState.currentLevel.layout[0].length).fill(null)
        );

        // Подготовка позиций для плиток
        const positions = [];
        for (let row = 0; row < gameState.layout.length; row++) {
            for (let col = 0; col < gameState.layout[0].length; col++) {
                if (gameState.layout[row][col] === 1) {
                    positions.push({ row, col });
                }
            }
        }
        
        // Перемешивание позиций
        shuffleArray(positions);
        
        // Установка плиток с проверкой четности
        let placed = 0;
        const tileTypes = [];
        
        // Создаем список плиток с учетом четности
        Object.entries(gameState.currentLevel.tileCounts).forEach(([type, count]) => {
            // Убедимся, что количество четное
            const evenCount = count % 2 === 0 ? count : count - 1;
            
            for (let i = 0; i < evenCount; i++) {
                tileTypes.push(type);
            }
        });
        
        // Перемешиваем типы плиток
        shuffleArray(tileTypes);
        
        // Устанавливаем плитки
        for (let i = 0; i < Math.min(tileTypes.length, positions.length); i++) {
            if (i >= positions.length) break;
            const pos = positions[i];
            gameState.board[pos.row][pos.col] = tileTypes[i];
        }
        
        // Проверка проходимости уровня
        if (!isLevelSolvable() && attempt < GAME_CONFIG.MAX_GENERATION_ATTEMPTS) {
            initGameBoard(attempt + 1);
            return;
        }
        
        // Отрисовка доски
        renderBoard();
    }

    // Проверка, является ли уровень проходимым
    function isLevelSolvable() {
        const availableTiles = [];
        for (let row = 0; row < gameState.board.length; row++) {
            for (let col = 0; col < gameState.board[0].length; col++) {
                if (gameState.board[row][col] && isTileAvailable(row, col)) {
                    availableTiles.push(gameState.board[row][col]);
                }
            }
        }
        
        // Проверяем, есть ли хотя бы одна пара
        const counts = {};
        availableTiles.forEach(tile => {
            counts[tile] = (counts[tile] || 0) + 1;
        });
        
        return Object.values(counts).some(count => count >= 2);
    }

    // Проверка, есть ли доступные пары
    function hasAvailablePairs() {
        const availableTiles = [];
        for (let row = 0; row < gameState.board.length; row++) {
            for (let col = 0; col < gameState.board[0].length; col++) {
                if (gameState.board[row][col] && isTileAvailable(row, col)) {
                    availableTiles.push(gameState.board[row][col]);
                }
            }
        }
        
        // Проверяем, есть ли хотя бы одна пара
        const counts = {};
        availableTiles.forEach(tile => {
            counts[tile] = (counts[tile] || 0) + 1;
        });
        
        return Object.values(counts).some(count => count >= 2);
    }

    // Перемешивание массива (алгоритм Фишера-Йетса)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Отрисовка игрового поля
    function renderBoard() {
        elements.gameBoard.innerHTML = '';
        const rows = gameState.layout.length;
        const cols = gameState.layout[0].length;
        
        // Устанавливаем grid-расположение
        elements.gameBoard.style.display = 'grid';
        elements.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        elements.gameBoard.style.width = '100%';
        elements.gameBoard.style.height = 'auto';
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileType = gameState.board[row][col];
                if (!tileType || gameState.layout[row][col] === 0) continue;
                
                // Проверяем доступность плитки
                const isAvailable = isTileAvailable(row, col);
                
                const tile = document.createElement('div');
                tile.className = `tile ${tileType} ${isAvailable ? 'available' : 'unavailable'}`;
                tile.textContent = gameState.currentLevel.symbols[tileType];
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                if (isAvailable) {
                    tile.addEventListener('click', () => handleTileClick(row, col));
                }
                
                elements.gameBoard.appendChild(tile);
            }
        }
    }

    // Проверка доступности плитки
    function isTileAvailable(row, col) {
        // Плитка должна существовать
        if (!gameState.board[row] || !gameState.board[row][col]) return false;
        
        // Проверяем, не перекрыта ли плитка сверху
        for (let r = 0; r < row; r++) {
            if (gameState.board[r][col] && gameState.layout[r][col] === 1) {
                return false;
            }
        }
        
        // Проверяем соседние плитки слева и справа
        const leftClear = col === 0 || !gameState.board[row][col-1] || gameState.layout[row][col-1] === 0;
        const rightClear = col === gameState.board[0].length - 1 || !gameState.board[row][col+1] || gameState.layout[row][col+1] === 0;
        
        return leftClear && rightClear;
    }

    // Обработка клика по плитке
    function handleTileClick(row, col) {
        if (!gameState.gameActive || gameState.isGameOver) return;
        
        const tileElement = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
        
        if (gameState.firstSelected === null) {
            // Первая выбранная плитка
            gameState.firstSelected = { row, col, type: gameState.board[row][col] };
            tileElement.classList.add('selected');
            elements.selectionStatus.textContent = 'Выбери вторую плитку';
        } else {
            // Вторая выбранная плитка
            const first = gameState.firstSelected;
            
            // Сброс выделения первой плитки
            document.querySelector(`.tile[data-row="${first.row}"][data-col="${first.col}"]`)
                .classList.remove('selected');
            
            // Проверка, не кликнули ли на ту же самую плитку
            if (first.row === row && first.col === col) {
                gameState.firstSelected = null;
                elements.selectionStatus.textContent = 'Выбери первую плитку';
                return;
            }
            
            const tileType = gameState.board[row][col];
            const sameType = (first.type === tileType);
            
            if (sameType) {
                // Успешное соединение
                removeTilePair(first.row, first.col, row, col);
            } else {
                // Ошибка: разные типы плиток
                applyPenalty('Разные символы нельзя соединить!');
                shakeTile(tileElement);
                shakeTile(document.querySelector(`.tile[data-row="${first.row}"][data-col="${first.col}"]`));
            }
            
            gameState.firstSelected = null;
            elements.selectionStatus.textContent = 'Выбери первую плитку';
        }
    }

    // Удаление пары плиток
    function removeTilePair(r1, c1, r2, c2) {
        gameState.board[r1][c1] = null;
        gameState.board[r2][c2] = null;
        
        const tile1 = document.querySelector(`.tile[data-row="${r1}"][data-col="${c1}"]`);
        const tile2 = document.querySelector(`.tile[data-row="${r2}"][data-col="${c2}"]`);
        
        if (tile1) tile1.classList.add('matched');
        if (tile2) tile2.classList.add('matched');
        
        const tileType = gameState.currentLevel.symbols[gameState.board[r1][c1]];
        gameState.pairsFound[tileType]++;
        gameState.totalPairsFound++;
        gameState.totalScore += 20;
        
        elements.scoreDisplay.textContent = gameState.totalScore;
        
        setTimeout(() => {
            renderBoard();
            checkLevelCompletion();
        }, GAME_CONFIG.ANIMATION_SPEED);
    }

    // Применение штрафа
    function applyPenalty(message) {
        if (gameState.penalties >= GAME_CONFIG.MAX_PENALTIES) return;
        
        gameState.penalties++;
        gameState.totalPenalties++;
        
        // Вычисление нового времени
        let currentTime = parseInt(elements.timerDisplay.textContent);
        currentTime = Math.max(0, currentTime - GAME_CONFIG.PENALTY_SECONDS);
        
        // Анимация штрафа
        elements.timerDisplay.textContent = currentTime;
        elements.timerDisplay.classList.add('penalty-animation');
        
        elements.selectionStatus.textContent = message;
        elements.selectionStatus.classList.add('penalty-animation');
        
        setTimeout(() => {
            elements.timerDisplay.classList.remove('penalty-animation');
            elements.selectionStatus.classList.remove('penalty-animation');
            if (elements.selectionStatus.textContent === message) {
                elements.selectionStatus.textContent = 'Выбери первую плитку';
            }
        }, 800);
        
        // Проверка окончания времени
        if (currentTime <= 0) {
            completeLevel(false);
        }
    }

    // Анимация тряски плитки при ошибке
    function shakeTile(tileElement) {
        if (!tileElement) return;
        tileElement.classList.add('error-shake');
        setTimeout(() => {
            tileElement.classList.remove('error-shake');
        }, 500);
    }

    // Проверка завершения уровня
    function checkLevelCompletion() {
        // Проверка, остались ли еще плитки
        const hasTilesLeft = gameState.board.some(row => 
            row.some(tile => tile !== null)
        );
        
        if (!hasTilesLeft) {
            completeLevel(true);
            return;
        }
        
        // Проверка на проигрыш (остались плитки, но нет доступных пар)
        if (!hasAvailablePairs()) {
            gameOver();
        }
    }

    // Игра окончена (проигрыш)
    function gameOver() {
        gameState.isGameOver = true;
        clearInterval(gameState.timerInterval);
        gameState.gameActive = false;
        
        // Показ экрана проигрыша
        elements.gameScreen.style.display = 'none';
        elements.gameOverScreen.style.display = 'block';
        
        // Сохранение результатов уровня
        const levelTimeUsed = gameState.currentLevel.duration - parseInt(elements.timerDisplay.textContent);
        gameState.totalTimeUsed += levelTimeUsed;
        
        // Сохранение результатов
        gameState.levelResults.push({
            levelId: gameState.currentLevel.id,
            levelName: gameState.currentLevel.name,
            score: parseInt(elements.scoreDisplay.textContent),
            pairsFound: gameState.totalPairsFound,
            timeUsed: levelTimeUsed,
            completed: false,
            penalties: gameState.penalties,
            pairsByType: {...gameState.pairsFound}
        });
    }

    // Завершение уровня
    function completeLevel(completedByPairs) {
        clearInterval(gameState.timerInterval);
        gameState.gameActive = false;
        
        // Сохранение результатов уровня
        const levelTimeUsed = gameState.currentLevel.duration - parseInt(elements.timerDisplay.textContent);
        gameState.totalTimeUsed += levelTimeUsed;
        
        // Сохранение результатов
        gameState.levelResults.push({
            levelId: gameState.currentLevel.id,
            levelName: gameState.currentLevel.name,
            score: parseInt(elements.scoreDisplay.textContent),
            pairsFound: gameState.totalPairsFound,
            timeUsed: levelTimeUsed,
            completed: completedByPairs,
            penalties: gameState.penalties,
            pairsByType: {...gameState.pairsFound}
        });
        
        // Если есть следующий уровень
        if (gameState.currentLevelIndex < LEVELS.length - 1) {
            setTimeout(() => {
                gameState.currentLevelIndex++;
                startNextLevel();
            }, 2000);
        } else {
            // Все уровни пройдены
            setTimeout(showFinalResults, 2000);
        }
    }

    // Старт следующего уровня
    function startNextLevel() {
        gameState.gameActive = true;
        elements.gameScreen.style.display = 'block';
        
        initCurrentLevel();
        
        // Сброс таймера для нового уровня
        elements.timerDisplay.textContent = gameState.currentLevel.duration;
        
        // Таймер уровня
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
            const currentTime = parseInt(elements.timerDisplay.textContent);
            if (currentTime <= 1) {
                completeLevel(false);
            } else {
                elements.timerDisplay.textContent = currentTime - 1;
            }
        }, 1000);
        
        elements.selectionStatus.textContent = 'Выбери первую плитку';
    }

    // Показ финальных результатов
    function showFinalResults() {
        elements.gameScreen.style.display = 'none';
        elements.resultScreen.style.display = 'block';
        
        // Общий счет
        gameState.totalScore = gameState.levelResults.reduce((sum, level) => 
            sum + level.score, 0);
        
        // Общее количество пар
        const totalPairs = gameState.levelResults.reduce((sum, level) => 
            sum + Object.values(level.pairsByType).reduce((a, b) => a + b, 0), 0);
        
        // Отображение результатов
        elements.totalScoreDisplay.textContent = gameState.totalScore;
        elements.totalPairsDisplay.textContent = totalPairs;
        elements.totalTimeDisplay.textContent = gameState.totalTimeUsed;
        
        // Детали по уровням
        elements.levelResultsContainer.innerHTML = '';
        gameState.levelResults.forEach((level, index) => {
            const levelElement = document.createElement('div');
            levelElement.className = 'level-result-item';
            
            const pairsCount = Object.values(level.pairsByType).reduce((a, b) => a + b, 0);
            const status = level.completed ? 
                `✅ Пройден (+${level.pairsByType.length * 20 * 5} очков)` : 
                `❌ Не пройден`;
            const penaltyText = level.penalties > 0 ? 
                ` | Штрафы: ${level.penalties}×${GAME_CONFIG.PENALTY_SECONDS}с` : '';
            
            levelElement.innerHTML = `
                <div class="level-name">${level.levelName}</div>
                <div class="level-stats">
                    Счёт: ${level.score} | 
                    Пар: ${pairsCount}${penaltyText}<br>
                    <small>${status}</small>
                </div>
            `;
            
            elements.levelResultsContainer.appendChild(levelElement);
        });
    }

    // Сброс игры
    function resetGame() {
        gameState.currentLevelIndex = 0;
        gameState.totalScore = 0;
        gameState.totalTimeUsed = 0;
        gameState.totalPairsFound = 0;
        gameState.totalPenalties = 0;
        gameState.levelResults = [];
        
        elements.startScreen.style.display = 'block';
        elements.resultScreen.style.display = 'none';
        elements.gameOverScreen.style.display = 'none';
        elements.gameScreen.style.display = 'none';
        
        clearInterval(gameState.timerInterval);
    }

    // Старт игры
    function startGame() {
        elements.startScreen.style.display = 'none';
        elements.gameScreen.style.display = 'block';
        
        gameState.gameActive = true;
        gameState.currentLevelIndex = 0;
        gameState.totalScore = 0;
        gameState.totalTimeUsed = 0;
        gameState.totalPairsFound = 0;
        gameState.totalPenalties = 0;
        gameState.levelResults = [];
        elements.scoreDisplay.textContent = '0';
        
        initCurrentLevel();
        
        // Таймер первого уровня
        elements.timerDisplay.textContent = gameState.currentLevel.duration;
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
            const currentTime = parseInt(elements.timerDisplay.textContent);
            if (currentTime <= 1) {
                completeLevel(false);
            } else {
                elements.timerDisplay.textContent = currentTime - 1;
            }
        }, 1000);
        
        elements.selectionStatus.textContent = 'Выбери первую плитку';
    }

    // Обработчики событий
    document.getElementById('start-button').addEventListener('click', startGame);
    
    document.getElementById('submit-button').addEventListener('click', () => {
        API.sendResult({
            totalScore: gameState.totalScore,
            totalPairs: gameState.totalPairsFound,
            totalTime: gameState.totalTimeUsed,
            totalPenalties: gameState.totalPenalties,
            levelsCompleted: gameState.levelResults.filter(l => l.completed).length,
            levelDetails: gameState.levelResults
        });
    });
    
    elements.restartButton.addEventListener('click', resetGame);
    elements.gameOverRestartButton.addEventListener('click', resetGame);
});