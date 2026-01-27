class Game {
    constructor() {
        this.currentScreen = 'start';
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION;
        this.timer = null;
        this.selectedTile = null;
        this.board = [];
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        // Инициализация Telegram WebApp
        TelegramAPI.init();
        
        // Установка обработчиков событий
        this.setupEventListeners();
        
        // Показ стартового экрана
        this.showScreen('start');
    }
    
    setupEventListeners() {
        // Кнопка начала игры
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Кнопка перезапуска игры
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        
        // Кнопка отправки результата
        document.getElementById('send-btn').addEventListener('click', () => this.sendResult());
        
        // Кнопка возврата в меню
        document.getElementById('menu-btn').addEventListener('click', () => this.showScreen('start'));
    }
    
    showScreen(screenName) {
        // Скрыть все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показать нужный экран
        document.getElementById(`${screenName}-screen`).classList.remove('hidden');
        
        // Обновить текущий экран
        this.currentScreen = screenName;
        
        // Если показали экран результата, обновить счет
        if (screenName === 'result') {
            this.updateResultScreen();
        }
    }
    
    startGame() {
        // Сброс состояния игры
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION;
        this.selectedTile = null;
        this.isProcessing = false;
        
        // Остановка предыдущего таймера
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Создание игрового поля
        this.createBoard();
        
        // Обновление интерфейса
        this.updateGameUI();
        
        // Запуск таймера
        this.timer = setInterval(() => this.updateTimer(), 1000);
        
        // Показать игровой экран
        this.showScreen('game');
    }
    
    createBoard() {
        this.board = [];
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        // Создание игрового поля
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            this.board[row] = [];
            
            for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
                // Создание случайного типа фишки
                const tileType = Math.floor(Math.random() * CONFIG.TILE_TYPES);
                this.board[row][col] = tileType;
                
                // Создание элемента фишки
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                // Установка цвета в зависимости от типа
                this.setTileColor(tile, tileType);
                
                // Обработчик клика
                tile.addEventListener('click', () => this.handleTileClick(row, col, tile));
                
                gameBoard.appendChild(tile);
            }
        }
        
        // Проверка, есть ли доступные ходы
        if (!this.hasValidMoves()) {
            // Если нет доступных ходов, пересоздаем поле
            this.createBoard();
        }
    }
    
    setTileColor(tile, tileType) {
        // Цвета для разных типов фишек
        const colors = [
            '#FF6B6B', // Красный
            '#4ECDC4', // Бирюзовый
            '#FFD166', // Желтый
            '#06D6A0', // Зеленый
            '#118AB2', // Синий
            '#9D4EDD'  // Фиолетовый
        ];
        
        tile.style.backgroundColor = colors[tileType % colors.length];
        
        // Добавляем небольшой узор для различия
        const patterns = ['●', '◆', '▲', '■', '★', '♥'];
        tile.textContent = patterns[tileType % patterns.length];
    }
    
    handleTileClick(row, col, tileElement) {
        // Если идет обработка совпадений, игнорируем клик
        if (this.isProcessing) return;
        
        // Если фишка уже выбрана
        if (this.selectedTile) {
            const [selectedRow, selectedCol] = this.selectedTile;
            
            // Проверяем, соседняя ли это фишка
            const isNeighbor = (
                (Math.abs(selectedRow - row) === 1 && selectedCol === col) ||
                (Math.abs(selectedCol - col) === 1 && selectedRow === row)
            );
            
            if (isNeighbor) {
                // Меняем фишки местами
                this.swapTiles(selectedRow, selectedCol, row, col);
                
                // Снимаем выделение
                document.querySelector('.tile.selected')?.classList.remove('selected');
                this.selectedTile = null;
            } else {
                // Снимаем выделение с предыдущей фишки
                document.querySelector('.tile.selected')?.classList.remove('selected');
                
                // Выделяем новую фишку
                tileElement.classList.add('selected');
                this.selectedTile = [row, col];
            }
        } else {
            // Выделяем фишку
            tileElement.classList.add('selected');
            this.selectedTile = [row, col];
        }
    }
    
    swapTiles(row1, col1, row2, col2) {
        // Меняем фишки местами в массиве
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        // Обновляем визуальное отображение
        const tiles = document.querySelectorAll('.tile');
        const tile1 = Array.from(tiles).find(tile => 
            parseInt(tile.dataset.row) === row1 && parseInt(tile.dataset.col) === col1
        );
        const tile2 = Array.from(tiles).find(tile => 
            parseInt(tile.dataset.row) === row2 && parseInt(tile.dataset.col) === col2
        );
        
        this.setTileColor(tile1, this.board[row1][col1]);
        this.setTileColor(tile2, this.board[row2][col2]);
        
        // Проверяем, есть ли совпадения после обмена
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // Если есть совпадения, обрабатываем их
            this.processMatches(matches);
        } else {
            // Если нет совпадений, возвращаем фишки на место
            const temp = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp;
            
            this.setTileColor(tile1, this.board[row1][col1]);
            this.setTileColor(tile2, this.board[row2][col2]);
        }
    }
    
    findMatches() {
        const matches = [];
        
        // Проверка горизонтальных совпадений
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            for (let col = 0; col < CONFIG.BOARD_SIZE - 2; col++) {
                const tileType = this.board[row][col];
                
                if (tileType !== null && 
                    this.board[row][col + 1] === tileType && 
                    this.board[row][col + 2] === tileType) {
                    
                    // Найдено совпадение из 3+ фишек
                    let matchLength = 3;
                    
                    // Проверяем, есть ли дополнительные совпадения
                    while (col + matchLength < CONFIG.BOARD_SIZE && 
                           this.board[row][col + matchLength] === tileType) {
                        matchLength++;
                    }
                    
                    // Добавляем совпадение в список
                    matches.push({
                        row,
                        startCol: col,
                        length: matchLength,
                        direction: 'horizontal',
                        tileType
                    });
                    
                    col += matchLength - 1;
                }
            }
        }
        
        // Проверка вертикальных совпадений
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            for (let row = 0; row < CONFIG.BOARD_SIZE - 2; row++) {
                const tileType = this.board[row][col];
                
                if (tileType !== null && 
                    this.board[row + 1][col] === tileType && 
                    this.board[row + 2][col] === tileType) {
                    
                    // Найдено совпадение из 3+ фишек
                    let matchLength = 3;
                    
                    // Проверяем, есть ли дополнительные совпадения
                    while (row + matchLength < CONFIG.BOARD_SIZE && 
                           this.board[row + matchLength][col] === tileType) {
                        matchLength++;
                    }
                    
                    // Добавляем совпадение в список
                    matches.push({
                        startRow: row,
                        col,
                        length: matchLength,
                        direction: 'vertical',
                        tileType
                    });
                    
                    row += matchLength - 1;
                }
            }
        }
        
        return matches;
    }
    
    processMatches(matches) {
        this.isProcessing = true;
        
        // Вычисляем очки
        let points = 0;
        
        matches.forEach(match => {
            // Базовые очки за совпадение
            let matchPoints = match.length * CONFIG.SCORE_PER_MATCH;
            
            // Бонус за длинные цепочки
            if (match.length >= CONFIG.BONUS_THRESHOLD) {
                matchPoints *= CONFIG.BONUS_MULTIPLIER;
            }
            
            points += matchPoints;
            
            // Помечаем фишки как совпавшие
            if (match.direction === 'horizontal') {
                for (let col = match.startCol; col < match.startCol + match.length; col++) {
                    this.markTileAsMatched(match.row, col);
                }
            } else { // vertical
                for (let row = match.startRow; row < match.startRow + match.length; row++) {
                    this.markTileAsMatched(row, match.col);
                }
            }
        });
        
        // Обновляем счет
        this.score += points;
        this.updateGameUI();
        
        // Удаляем совпавшие фишки и создаем новые
        setTimeout(() => {
            this.removeMatchedTiles();
            this.fillEmptyTiles();
            
            // Проверяем, есть ли новые совпадения после заполнения
            const newMatches = this.findMatches();
            
            if (newMatches.length > 0) {
                // Если есть новые совпадения, обрабатываем их
                this.processMatches(newMatches);
            } else {
                this.isProcessing = false;
                
                // Проверяем, есть ли доступные ходы
                if (!this.hasValidMoves()) {
                    // Перемешиваем поле, если нет доступных ходов
                    this.shuffleBoard();
                }
            }
        }, 500);
    }
    
    markTileAsMatched(row, col) {
        const tiles = document.querySelectorAll('.tile');
        const tile = Array.from(tiles).find(tile => 
            parseInt(tile.dataset.row) === row && parseInt(tile.dataset.col) === col
        );
        
        if (tile) {
            tile.classList.add('matched');
        }
    }
    
    removeMatchedTiles() {
        // Удаляем совпавшие фишки из массива
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
                const tiles = document.querySelectorAll('.tile');
                const tile = Array.from(tiles).find(tile => 
                    parseInt(tile.dataset.row) === row && parseInt(tile.dataset.col) === col
                );
                
                if (tile && tile.classList.contains('matched')) {
                    this.board[row][col] = null;
                }
            }
        }
    }
    
    fillEmptyTiles() {
        // Заполняем пустые клетки новыми фишками
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            let emptySpaces = 0;
            
            // Считаем пустые клетки снизу вверх
            for (let row = CONFIG.BOARD_SIZE - 1; row >= 0; row--) {
                if (this.board[row][col] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Перемещаем фишку вниз
                    this.board[row + emptySpaces][col] = this.board[row][col];
                    this.board[row][col] = null;
                }
            }
            
            // Заполняем верхние пустые клетки новыми фишками
            for (let row = 0; row < emptySpaces; row++) {
                const tileType = Math.floor(Math.random() * CONFIG.TILE_TYPES);
                this.board[row][col] = tileType;
            }
        }
        
        // Обновляем визуальное отображение
        this.updateBoardVisuals();
    }
    
    updateBoardVisuals() {
        const tiles = document.querySelectorAll('.tile');
        
        tiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            
            // Снимаем класс matched
            tile.classList.remove('matched');
            
            // Обновляем цвет
            this.setTileColor(tile, this.board[row][col]);
        });
    }
    
    hasValidMoves() {
        // Проверяем, есть ли доступные ходы
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
                // Проверяем соседние фишки
                const directions = [
                    [0, 1],  // Вправо
                    [1, 0],  // Вниз
                ];
                
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    
                    if (newRow < CONFIG.BOARD_SIZE && newCol < CONFIG.BOARD_SIZE) {
                        // Меняем фишки местами временно
                        const temp = this.board[row][col];
                        this.board[row][col] = this.board[newRow][newCol];
                        this.board[newRow][newCol] = temp;
                        
                        // Проверяем, есть ли совпадения
                        const matches = this.findMatches();
                        
                        // Возвращаем фишки на место
                        this.board[newRow][newCol] = this.board[row][col];
                        this.board[row][col] = temp;
                        
                        if (matches.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    shuffleBoard() {
        // Создаем одномерный массив всех фишек
        let allTiles = [];
        
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
                allTiles.push(this.board[row][col]);
            }
        }
        
        // Перемешиваем массив
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }
        
        // Заполняем поле перемешанными фишками
        let index = 0;
        for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
            for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
                this.board[row][col] = allTiles[index++];
            }
        }
        
        // Обновляем визуальное отображение
        this.updateBoardVisuals();
        
        // Проверяем, есть ли доступные ходы после перемешивания
        if (!this.hasValidMoves()) {
            // Если все еще нет доступных ходов, создаем новое поле
            this.createBoard();
        }
    }
    
    updateGameUI() {
        // Обновляем таймер
        document.getElementById('time-left').textContent = this.timeLeft;
        
        // Обновляем счет
        document.getElementById('current-score').textContent = this.score;
    }
    
    updateTimer() {
        this.timeLeft--;
        this.updateGameUI();
        
        if (this.timeLeft <= 0) {
            // Время вышло
            clearInterval(this.timer);
            this.endGame();
        }
    }
    
    endGame() {
        // Показываем экран результата
        this.showScreen('result');
    }
    
    updateResultScreen() {
        // Обновляем счет на экране результата
        document.getElementById('final-score').textContent = this.score;
        
        // Определяем количество звезд в зависимости от счета
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));
        
        let starCount = 1;
        if (this.score >= 500) starCount = 3;
        else if (this.score >= 200) starCount = 2;
        
        for (let i = 0; i < starCount; i++) {
            stars[i].classList.add('active');
        }
    }
    
    sendResult() {
        // Подготавливаем данные для отправки
        const gameResult = {
            GAME_RESULT: {
                score: this.score,
                time: CONFIG.GAME_DURATION - this.timeLeft,
                stars: this.getStarCount()
            }
        };
        
        // Отправляем данные в Telegram
        TelegramAPI.sendData(gameResult);
        
        // Показываем подтверждение
        alert('Результат отправлен!');
    }
    
    getStarCount() {
        if (this.score >= 500) return 3;
        if (this.score >= 200) return 2;
        return 1;
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});