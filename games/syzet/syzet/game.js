class BlockBlast {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 500;
        this.canvas.height = 500;
        
        this.grid = [];
        this.currentBlocks = [];
        this.selectedBlock = null;
        
        // Drag & drop
        this.isDragging = false;
        this.previewX = -1;
        this.previewY = -1;
        
        // Анимации
        this.animations = [];
        
        // Флаг game over
        this.gameOverFlag = false;
        
        // Аудио
        this.audioContext = null;
        this.musicInterval = null;
        
        // Новая, более приятная музыка - Lo-fi мелодия
        this.musicNotes = [
            // Аккорды (более мягкие и приятные)
            { note: 261.63, duration: 0.5 }, // C4
            { note: 329.63, duration: 0.5 }, // E4
            { note: 392.00, duration: 0.5 }, // G4
            { note: 523.25, duration: 1.0 }, // C5
            
            { note: 293.66, duration: 0.5 }, // D4
            { note: 369.99, duration: 0.5 }, // F#4
            { note: 440.00, duration: 0.5 }, // A4
            { note: 587.33, duration: 1.0 }, // D5
            
            { note: 329.63, duration: 0.5 }, // E4
            { note: 415.30, duration: 0.5 }, // G#4
            { note: 493.88, duration: 0.5 }, // B4
            { note: 659.25, duration: 1.0 }, // E5
            
            { note: 349.23, duration: 0.5 }, // F4
            { note: 440.00, duration: 0.5 }, // A4
            { note: 523.25, duration: 0.5 }, // C5
            { note: 698.46, duration: 1.0 }, // F5
            
            // Плавный переход
            { note: 392.00, duration: 0.25 }, // G4
            { note: 440.00, duration: 0.25 }, // A4
            { note: 493.88, duration: 0.25 }, // B4
            { note: 523.25, duration: 0.5 },  // C5
            { note: 587.33, duration: 0.5 },  // D5
            { note: 659.25, duration: 1.0 },  // E5
            
            // Мягкое завершение
            { note: 261.63, duration: 0.5 }, // C4
            { note: 329.63, duration: 0.5 }, // E4
            { note: 392.00, duration: 0.5 }, // G4
            { note: 523.25, duration: 2.0 }, // C5
        ];
        
        this.currentNoteIndex = 0;
        
        this.initAudio();
        this.initGrid();
        this.initEventListeners();
        this.generateNewBlocks();
        this.initSettingsListeners();
        
        this.gameLoop();
    }
    
    initGrid() {
        for (let i = 0; i < CONFIG.game.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < CONFIG.game.gridSize; j++) {
                this.grid[i][j] = null;
            }
        }
    }
    
    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(type = 'place') {
        if (!this.audioContext || !gameState.sfxEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        let freq = 440;
        let duration = 0.1;
        
        switch(type) {
            case 'place':
                freq = 523.25 + Math.random() * 100; // Случайная нота для разнообразия
                duration = 0.05;
                break;
            case 'clear':
                freq = 659.25;
                duration = 0.15;
                break;
            case 'combo':
                // Приятный аккорд для комбо
                this.playChord([523.25, 659.25, 783.99]);
                return;
            case 'gameOver':
                freq = 220;
                duration = 0.8;
                break;
        }
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.value = 0.1 * (gameState.sfxVolume / 100);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    playChord(notes) {
        if (!this.audioContext || !gameState.sfxEnabled) return;
        
        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = note;
            
            gain.gain.value = 0.05 * (gameState.sfxVolume / 100);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        });
    }
    
    startMusic() {
        if (!this.audioContext || !gameState.musicEnabled) return;
        
        this.stopMusic();
        this.currentNoteIndex = 0;
        
        const playNextNote = () => {
            if (!gameState.musicEnabled || gameState.currentScreen !== 'game') {
                this.stopMusic();
                return;
            }
            
            const noteData = this.musicNotes[this.currentNoteIndex];
            
            // Основная нота
            const osc1 = this.audioContext.createOscillator();
            const gain1 = this.audioContext.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.value = noteData.note;
            
            gain1.gain.value = 0.03 * (gameState.musicVolume / 100);
            gain1.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteData.duration);
            
            osc1.connect(gain1);
            gain1.connect(this.audioContext.destination);
            
            // Добавляем вторую октаву для полноты звучания
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            
            osc2.type = 'triangle';
            osc2.frequency.value = noteData.note * 2;
            
            gain2.gain.value = 0.01 * (gameState.musicVolume / 100);
            gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteData.duration);
            
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            
            osc1.start();
            osc2.start();
            
            osc1.stop(this.audioContext.currentTime + noteData.duration);
            osc2.stop(this.audioContext.currentTime + noteData.duration);
            
            // Переход к следующей ноте
            this.currentNoteIndex = (this.currentNoteIndex + 1) % this.musicNotes.length;
            
            // Планируем следующую ноту
            this.musicInterval = setTimeout(playNextNote, noteData.duration * 1000);
        };
        
        // Начинаем проигрывание
        playNextNote();
    }
    
    stopMusic() {
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }
    
    initSettingsListeners() {
        const musicSlider = document.getElementById('music-volume');
        const sfxSlider = document.getElementById('sfx-volume');
        const animSlider = document.getElementById('animation-speed');
        
        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                gameState.musicVolume = e.target.value;
                document.getElementById('music-value').textContent = e.target.value + '%';
            });
        }
        
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                gameState.sfxVolume = e.target.value;
                document.getElementById('sfx-value').textContent = e.target.value + '%';
            });
        }
        
        if (animSlider) {
            animSlider.addEventListener('input', (e) => {
                gameState.animationSpeed = parseFloat(e.target.value);
                document.getElementById('animation-value').textContent = e.target.value + 'x';
            });
        }
    }
    
    generateNewBlocks() {
        const availableBlocks = [...CONFIG.blocks];
        this.currentBlocks = [];
        
        for (let i = 0; i < 3; i++) {
            if (availableBlocks.length === 0) break;
            
            const index = Math.floor(Math.random() * availableBlocks.length);
            const block = { ...availableBlocks[index] };
            block.id = Date.now() + i;
            block.color = Math.floor(Math.random() * CONFIG.game.colors.length);
            this.currentBlocks.push(block);
            
            availableBlocks.splice(index, 1);
        }
        
        this.updateBlocksDisplay();
        
        // Проверяем game over после генерации новых блоков
        setTimeout(() => {
            this.checkGameOver();
        }, 100);
    }
    
    updateBlocksDisplay() {
        const container = document.getElementById('next-blocks-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.currentBlocks.forEach((block, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = `next-block ${this.selectedBlock?.id === block.id ? 'selected' : ''}`;
            blockDiv.onclick = () => this.selectBlock(index);
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    
                    if (block.shape[i] && block.shape[i][j] === 1) {
                        cell.classList.add('filled');
                        cell.style.background = `linear-gradient(135deg, ${CONFIG.game.colors[block.color]}, ${this.adjustColor(CONFIG.game.colors[block.color], -30)})`;
                    }
                    
                    blockDiv.appendChild(cell);
                }
            }
            
            container.appendChild(blockDiv);
        });
    }
    
    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = (num >> 16) + percent;
        const g = ((num >> 8) & 0x00FF) + percent;
        const b = (num & 0x0000FF) + percent;
        return '#' + (0x1000000 + (r < 255 ? (r < 0 ? 0 : r) : 255) * 0x10000 + 
                     (g < 255 ? (g < 0 ? 0 : g) : 255) * 0x100 + 
                     (b < 255 ? (b < 0 ? 0 : b) : 255)).toString(16).slice(1);
    }
    
    selectBlock(index) {
        if (this.gameOverFlag) return;
        
        this.selectedBlock = {
            ...this.currentBlocks[index],
            index: index
        };
        this.updateBlocksDisplay();
    }
    
    initEventListeners() {
        // Mouse down - начало перетаскивания
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameOverFlag) return;
            
            if (!this.selectedBlock) {
                this.showMessage('Выберите блок справа');
                return;
            }
            
            this.isDragging = true;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width) / CONFIG.game.cellSize);
            const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height) / CONFIG.game.cellSize);
            
            this.previewX = Math.max(0, Math.min(x, CONFIG.game.gridSize - 1));
            this.previewY = Math.max(0, Math.min(y, CONFIG.game.gridSize - 1));
        });
        
        // Mouse move - обновление предпросмотра
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameOverFlag) return;
            if (!this.selectedBlock || !this.isDragging) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width) / CONFIG.game.cellSize);
            const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height) / CONFIG.game.cellSize);
            
            if (x >= 0 && x < CONFIG.game.gridSize && y >= 0 && y < CONFIG.game.gridSize) {
                this.previewX = x;
                this.previewY = y;
            }
        });
        
        // Mouse up - размещение блока
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.gameOverFlag) return;
            if (!this.selectedBlock || !this.isDragging) {
                this.isDragging = false;
                return;
            }
            
            this.isDragging = false;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width) / CONFIG.game.cellSize);
            const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height) / CONFIG.game.cellSize);
            
            if (x >= 0 && x < CONFIG.game.gridSize && y >= 0 && y < CONFIG.game.gridSize) {
                if (this.canPlaceBlock(this.selectedBlock, x, y)) {
                    this.placeBlock(this.selectedBlock, x, y);
                    this.playSound('place');
                } else {
                    this.showMessage('Нельзя поставить блок сюда');
                }
            }
            
            this.previewX = -1;
            this.previewY = -1;
        });
        
        // Mouse leave - отмена
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.previewX = -1;
            this.previewY = -1;
        });
    }
    
    showMessage(text) {
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 18px;
            z-index: 1000;
            border: 1px solid #FFD700;
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.remove(), 2000);
    }
    
    canPlaceBlock(block, gridX, gridY) {
        for (let i = 0; i < block.shape.length; i++) {
            for (let j = 0; j < block.shape[i].length; j++) {
                if (block.shape[i][j] === 1) {
                    const x = gridX + j;
                    const y = gridY + i;
                    
                    if (x < 0 || x >= CONFIG.game.gridSize || y < 0 || y >= CONFIG.game.gridSize) {
                        return false;
                    }
                    
                    if (this.grid[y][x] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placeBlock(block, gridX, gridY) {
        // Размещаем блок
        for (let i = 0; i < block.shape.length; i++) {
            for (let j = 0; j < block.shape[i].length; j++) {
                if (block.shape[i][j] === 1) {
                    const x = gridX + j;
                    const y = gridY + i;
                    this.grid[y][x] = block.color;
                }
            }
        }
        
        // Добавляем очки (увеличены для более легкого заработка)
        gameState.score += (block.score || 10) * 2;
        this.updateScore();
        
        // Удаляем использованный блок
        this.currentBlocks.splice(block.index, 1);
        this.selectedBlock = null;
        
        // Проверяем линии
        setTimeout(() => {
            const cleared = this.checkAndClearLines();
            if (cleared > 0) {
                this.playSound(cleared > 1 ? 'combo' : 'clear');
            }
            
            // Если блоки кончились, генерируем новые
            if (this.currentBlocks.length === 0) {
                setTimeout(() => {
                    this.generateNewBlocks();
                }, 300 * gameState.animationSpeed);
            } else {
                this.updateBlocksDisplay();
                this.checkGameOver();
            }
        }, 200 * gameState.animationSpeed);
    }
    
    checkAndClearLines() {
        let linesCleared = 0;
        const linesToClear = [];
        
        // Горизонтальные линии
        for (let y = 0; y < CONFIG.game.gridSize; y++) {
            let full = true;
            for (let x = 0; x < CONFIG.game.gridSize; x++) {
                if (this.grid[y][x] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                linesToClear.push({type: 'horizontal', index: y});
                linesCleared++;
            }
        }
        
        // Вертикальные линии
        for (let x = 0; x < CONFIG.game.gridSize; x++) {
            let full = true;
            for (let y = 0; y < CONFIG.game.gridSize; y++) {
                if (this.grid[y][x] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                linesToClear.push({type: 'vertical', index: x});
                linesCleared++;
            }
        }
        
        // Очищаем линии
        if (linesCleared > 0) {
            this.clearLines(linesToClear);
            
            const bonusIndex = Math.min(linesCleared - 1, CONFIG.lineBonus.length - 1);
            const bonus = CONFIG.lineBonus[bonusIndex] * 2;
            gameState.score += bonus;
            this.updateScore();
            this.showMessage(`+${bonus} БОНУС!`);
        }
        
        return linesCleared;
    }
    
    clearLines(lines) {
        lines.forEach((line, lineIndex) => {
            setTimeout(() => {
                if (line.type === 'horizontal') {
                    for (let x = 0; x < CONFIG.game.gridSize; x++) {
                        if (this.grid[line.index][x] !== null) {
                            this.addPopAnimation(x, line.index, this.grid[line.index][x]);
                            this.grid[line.index][x] = null;
                        }
                    }
                } else {
                    for (let y = 0; y < CONFIG.game.gridSize; y++) {
                        if (this.grid[y][line.index] !== null) {
                            this.addPopAnimation(line.index, y, this.grid[y][line.index]);
                            this.grid[y][line.index] = null;
                        }
                    }
                }
            }, lineIndex * 300 * gameState.animationSpeed);
        });
    }
    
    addPopAnimation(x, y, colorIndex) {
        this.animations.push({
            x: x * CONFIG.game.cellSize + CONFIG.game.cellSize/2,
            y: y * CONFIG.game.cellSize + CONFIG.game.cellSize/2,
            color: CONFIG.game.colors[colorIndex],
            progress: 0
        });
    }
    
    updateScore() {
        document.getElementById('score').textContent = gameState.score;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            document.getElementById('high-score').textContent = gameState.highScore;
        }
    }
    
    checkGameOver() {
        if (this.gameOverFlag) return true;
        if (this.currentBlocks.length === 0) return false;
        
        for (let block of this.currentBlocks) {
            for (let y = 0; y < CONFIG.game.gridSize; y++) {
                for (let x = 0; x < CONFIG.game.gridSize; x++) {
                    if (this.canPlaceBlock(block, x, y)) {
                        return false;
                    }
                }
            }
        }
        
        this.triggerGameOver();
        return true;
    }
    
    triggerGameOver() {
        if (this.gameOverFlag) return;
        
        this.gameOverFlag = true;
        this.playSound('gameOver');
        
        const msg = document.createElement('div');
        msg.textContent = `ИГРА ОКОНЧЕНА! СЧЕТ: ${gameState.score}`;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ff4757);
            color: white;
            padding: 30px 50px;
            border-radius: 30px;
            font-size: 28px;
            font-weight: bold;
            z-index: 2000;
            border: 2px solid white;
            box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
            animation: gameOverPop 0.5s ease;
            text-align: center;
        `;
        document.body.appendChild(msg);
        
        if (gameState.score > gameState.records[2]) {
            gameState.records.push(gameState.score);
            gameState.records.sort((a, b) => b - a);
            gameState.records = gameState.records.slice(0, 3);
            saveGameState();
        }
        
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'ИГРАТЬ СНОВА';
        restartBtn.style.cssText = `
            position: fixed;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            color: #ff4757;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: bold;
            z-index: 2000;
            border: none;
            cursor: pointer;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
            animation: gameOverPop 0.5s ease;
        `;
        restartBtn.onclick = () => {
            msg.remove();
            restartBtn.remove();
            this.restartGame();
        };
        document.body.appendChild(restartBtn);
        
        this.selectedBlock = null;
        this.updateBlocksDisplay();
    }
    
    restartGame() {
        this.gameOverFlag = false;
        gameState.score = 0;
        this.initGrid();
        this.generateNewBlocks();
        this.selectedBlock = null;
        this.isDragging = false;
        this.previewX = -1;
        this.previewY = -1;
        this.animations = [];
        
        document.getElementById('score').textContent = '0';
        this.updateBlocksDisplay();
        
        this.showMessage('Новая игра! Удачи!');
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const size = CONFIG.game.cellSize;
        
        // Фон
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Сетка
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i <= CONFIG.game.gridSize; i++) {
            const pos = i * size;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        // Блоки
        for (let y = 0; y < CONFIG.game.gridSize; y++) {
            for (let x = 0; x < CONFIG.game.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    const color = CONFIG.game.colors[this.grid[y][x]];
                    
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.shadowBlur = 15;
                    
                    const gradient = this.ctx.createLinearGradient(
                        x * size, y * size,
                        (x + 1) * size, (y + 1) * size
                    );
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, this.adjustColor(color, -30));
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.roundRect(x * size + 3, y * size + 3, size - 6, size - 6, 8);
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 5;
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.beginPath();
                    this.roundRect(x * size + 5, y * size + 5, size - 20, 6, 3);
                    this.ctx.fill();
                }
            }
        }
        
        // Предпросмотр
        if (!this.gameOverFlag && this.selectedBlock && this.previewX >= 0 && this.previewY >= 0) {
            const block = this.selectedBlock;
            const canPlace = this.canPlaceBlock(block, this.previewX, this.previewY);
            
            for (let i = 0; i < block.shape.length; i++) {
                for (let j = 0; j < block.shape[i].length; j++) {
                    if (block.shape[i][j] === 1) {
                        const x = this.previewX + j;
                        const y = this.previewY + i;
                        
                        if (x >= 0 && x < CONFIG.game.gridSize && y >= 0 && y < CONFIG.game.gridSize) {
                            this.ctx.globalAlpha = 0.4;
                            this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                            this.ctx.shadowBlur = 20;
                            
                            this.ctx.beginPath();
                            this.roundRect(x * size + 3, y * size + 3, size - 6, size - 6, 8);
                            this.ctx.fill();
                            
                            this.ctx.strokeStyle = canPlace ? '#00ff00' : '#ff0000';
                            this.ctx.lineWidth = 3;
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }
        
        // Анимации
        this.animations = this.animations.filter(anim => {
            anim.progress += 0.02 * gameState.animationSpeed;
            
            if (anim.progress < 1) {
                this.ctx.save();
                this.ctx.globalAlpha = 1 - anim.progress;
                this.ctx.translate(anim.x, anim.y);
                this.ctx.scale(1 + anim.progress * 2, 1 + anim.progress * 2);
                this.ctx.fillStyle = anim.color;
                this.ctx.shadowBlur = 30;
                this.ctx.shadowColor = anim.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return true;
            }
            return false;
        });
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Методы управления экранами
    showMenu() {
        this.stopMusic();
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('menu').classList.add('active');
        gameState.currentScreen = 'menu';
        saveGameState();
    }
    
    showSettings() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('settings').classList.add('active');
        gameState.currentScreen = 'settings';
        
        document.getElementById('music-volume').value = gameState.musicVolume;
        document.getElementById('music-value').textContent = gameState.musicVolume + '%';
        document.getElementById('sfx-volume').value = gameState.sfxVolume;
        document.getElementById('sfx-value').textContent = gameState.sfxVolume + '%';
        document.getElementById('animation-speed').value = gameState.animationSpeed;
        document.getElementById('animation-value').textContent = gameState.animationSpeed + 'x';
    }
    
    showRecords() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('records').classList.add('active');
        gameState.currentScreen = 'records';
        
        document.getElementById('record1').textContent = gameState.records[0];
        document.getElementById('record2').textContent = gameState.records[1];
        document.getElementById('record3').textContent = gameState.records[2];
    }
    
    startGame() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('game').classList.add('active');
        
        gameState.currentScreen = 'game';
        this.restartGame();
        
        this.startMusic();
    }
    
    toggleMusic() {
        gameState.musicEnabled = !gameState.musicEnabled;
        const btn = document.getElementById('music-toggle');
        const icon = btn.querySelector('.music-icon');
        icon.textContent = gameState.musicEnabled ? '🔊' : '🔇';
        
        if (gameState.musicEnabled && gameState.currentScreen === 'game') {
            this.startMusic();
        } else {
            this.stopMusic();
        }
    }
}

// Инициализация
window.onload = () => {
    window.game = new BlockBlast();
};