// Основной игровой модуль
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.setupCanvas();
        this.init();
        this.bindEvents();
    }

    setupCanvas() {
        const size = CONFIG.BLOCK_SIZE;
        this.canvas.width = CONFIG.GRID_WIDTH * size;
        this.canvas.height = CONFIG.GRID_HEIGHT * size;
        
        this.nextCanvas.width = 4 * size;
        this.nextCanvas.height = 4 * size;
    }

    init() {
        // Инициализация игрового поля
        this.grid = Array.from({ length: CONFIG.GRID_HEIGHT }, 
            () => Array(CONFIG.GRID_WIDTH).fill(0));
        
        // Инициализация игровых переменных
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameActive = false;
        this.gameInterval = null;
        
        // Инициализация фигур
        this.currentPiece = null;
        this.nextPiece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        
        // Генерация первых фигур
        this.generateNewPiece();
        this.generateNextPiece();
        
        // Обновление интерфейса
        this.updateUI();
        
        // Отрисовка начального состояния
        this.draw();
    }

    bindEvents() {
        // Привязка кнопок меню
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('share-btn').addEventListener('click', () => this.shareResults());
        
        // Привязка игровых кнопок
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('drop-btn').addEventListener('click', () => this.dropPiece());
        
        // Управление с клавиатуры для тестирования
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.dropPiece();
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey) this.restartGame();
                    break;
            }
        });
    }

    showScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        // Показываем нужный экран
        document.getElementById(`${screenName}-screen`).classList.add('active');
    }

    startGame() {
        this.showScreen('game');
        this.init();
        this.gameActive = true;
        this.startGameLoop();
    }

    startGameLoop() {
        // Останавливаем предыдущий интервал, если он есть
        if (this.gameInterval) clearInterval(this.gameInterval);
        
        // Рассчитываем скорость в зависимости от уровня
        const speed = Math.max(100, CONFIG.INITIAL_SPEED - (this.level - 1) * CONFIG.SPEED_INCREMENT);
        
        // Запускаем игровой цикл
        this.gameInterval = setInterval(() => {
            if (!this.movePiece(0, 1)) {
                // Если фигура не может двигаться вниз
                this.lockPiece();
                this.clearLines();
                this.generateNewPiece();
                
                // Проверяем, не закончилась ли игра
                if (this.checkCollision(this.pieceX, this.pieceY, this.currentPiece.shape)) {
                    this.gameOver("Фигуры достигли верха!");
                }
            }
            this.draw();
        }, speed);
    }

    generateNewPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
            this.generateNextPiece();
        } else {
            const randomIndex = Math.floor(Math.random() * CONFIG.TETROMINOS.length);
            this.currentPiece = CONFIG.TETROMINOS[randomIndex];
        }
        
        // Устанавливаем начальную позицию фигуры
        this.pieceX = Math.floor(CONFIG.GRID_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.pieceY = 0;
        
        // Отрисовываем следующую фигуру
        this.drawNextPiece();
    }

    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * CONFIG.TETROMINOS.length);
        this.nextPiece = CONFIG.TETROMINOS[randomIndex];
        this.drawNextPiece();
    }

    draw() {
        // Очищаем холст
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем зафиксированные фигуры на поле
        for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    const pieceIndex = this.grid[y][x] - 1;
                    const color = CONFIG.TETROMINOS[pieceIndex].color;
                    this.drawBlock(x, y, color, this.ctx);
                }
            }
        }
        
        // Рисуем текущую падающую фигуру
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.pieceX + x,
                            this.pieceY + y,
                            this.currentPiece.color,
                            this.ctx
                        );
                    }
                }
            }
        }
        
        // Рисуем сетку поля
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= CONFIG.GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * CONFIG.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= CONFIG.GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawBlock(x, y, color, context) {
        const size = CONFIG.BLOCK_SIZE;
        
        // Основной цвет блока
        context.fillStyle = color;
        context.fillRect(x * size, y * size, size, size);
        
        // Контур блока
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.strokeRect(x * size, y * size, size, size);
        
        // Светлый край (эффект объема)
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * size, y * size, size - 1, 2);
        context.fillRect(x * size, y * size, 2, size - 1);
        
        // Темный край (эффект объема)
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(x * size + 2, y * size + size - 2, size - 2, 2);
        context.fillRect(x * size + size - 2, y * size + 2, 2, size - 2);
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const piece = this.nextPiece;
        const offsetX = (4 - piece.shape[0].length) / 2;
        const offsetY = (4 - piece.shape.length) / 2;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(
                        offsetX + x,
                        offsetY + y,
                        piece.color,
                        this.nextCtx
                    );
                }
            }
        }
    }

    movePiece(dx, dy) {
        const newX = this.pieceX + dx;
        const newY = this.pieceY + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.pieceX = newX;
            this.pieceY = newY;
            this.draw();
            return true;
        }
        return false;
    }

    rotatePiece() {
        if (!this.currentPiece || this.currentPiece.name === 'O') return;
        
        const rotated = [];
        const shape = this.currentPiece.shape;
        const size = shape.length;
        
        // Создаем повернутую матрицу (поворот на 90 градусов)
        for (let y = 0; y < size; y++) {
            rotated[y] = [];
            for (let x = 0; x < size; x++) {
                rotated[y][x] = shape[size - 1 - x][y];
            }
        }
        
        // Проверяем коллизию после поворота
        if (!this.checkCollision(this.pieceX, this.pieceY, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
            return true;
        }
        return false;
    }

    dropPiece() {
        // Падение фигуры до самого низа
        while (this.movePiece(0, 1)) {}
    }

    checkCollision(x, y, shape) {
        // Проверяем коллизии фигуры с границами и другими фигурами
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // Проверка границ и других фигур
                    if (
                        newX < 0 || 
                        newX >= CONFIG.GRID_WIDTH || 
                        newY >= CONFIG.GRID_HEIGHT ||
                        (newY >= 0 && this.grid[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        // Фиксация фигуры на поле
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const gridX = this.pieceX + x;
                    const gridY = this.pieceY + y;
                    
                    if (gridY >= 0) {
                        const pieceIndex = CONFIG.TETROMINOS.findIndex(p => p.name === this.currentPiece.name);
                        this.grid[gridY][gridX] = pieceIndex + 1;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        // Проверяем каждую линию снизу вверх
        for (let y = CONFIG.GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                // Удаляем заполненную линию
                this.grid.splice(y, 1);
                // Добавляем новую пустую линию сверху
                this.grid.unshift(Array(CONFIG.GRID_WIDTH).fill(0));
                linesCleared++;
                y++; // Проверяем ту же позицию снова
            }
        }
        
        if (linesCleared > 0) {
            // Обновляем счет в зависимости от количества собранных линий
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            
            this.updateUI();
            this.startGameLoop(); // Обновляем скорость
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }

    gameOver(reason = "Игра завершена!") {
        this.gameActive = false;
        
        // Останавливаем игровой цикл
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Обновляем результаты на экране
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('game-over-message').textContent = reason;
        
        // Отправляем результат в Telegram
        if (typeof sendGameResult === 'function') {
            sendGameResult(this.score, this.lines, this.level);
        }
        
        // Показываем экран результатов
        this.showScreen('result');
    }

    restartGame() {
        this.startGame();
    }

    shareResults() {
        const message = `Я набрала ${this.score} очков в Тетрисе! Собрала ${this.lines} линий и достигла ${this.level} уровня! Попробуй побить мой рекорд!`;
        
        if (typeof TelegramGameShare === 'function') {
            TelegramGameShare(message);
        } else {
            alert(message);
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TetrisGame();
});