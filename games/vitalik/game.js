class GameManager {
    constructor() {
        this.currentGame = null;
        this.currentGameInstance = null;
        this.score = 0;
        this.combo = 0;
        this.settings = {...CONFIG.settings};
        this.sounds = {};
        this.musicTimeout = null;
        this.currentMusicType = 'piano';
        this.notificationTimeout = null;
        this.musicIndicator = null;
        this.audioContext = null;
        this.init();
        this.initSettings();
        this.initSounds();
        this.initMusic();
    }

    init() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => this.startGame(card.dataset.game));
        });
        document.getElementById('backToMenu').addEventListener('click', () => this.showMenu());
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.toggleSettings());
    }

    initSettings() {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            this.settings = {...this.settings, ...JSON.parse(savedSettings)};
        }
        
        this.currentMusicType = this.settings.musicType || 'piano';
        this.applySettings();
        
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveSettings();
            this.showNotification(`Звуки ${e.target.checked ? 'включены' : 'выключены'}`);
        });
        
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            this.settings.musicEnabled = e.target.checked;
            this.saveSettings();
            if (this.settings.musicEnabled) {
                this.startMusic();
            } else {
                this.stopMusic();
            }
            this.showNotification(`Музыка ${e.target.checked ? 'включена' : 'выключена'}`);
        });
        
        document.getElementById('musicSelect').addEventListener('change', (e) => {
            this.currentMusicType = e.target.value;
            this.settings.musicType = this.currentMusicType;
            this.saveSettings();
            if (this.settings.musicEnabled) {
                this.stopMusic();
                this.startMusic();
            }
            this.showNotification(`Мелодия: ${e.target.options[e.target.selectedIndex].text}`);
        });
        
        document.getElementById('animationsToggle').addEventListener('change', (e) => {
            this.settings.animationsEnabled = e.target.checked;
            this.saveSettings();
            this.showNotification(`Анимации ${e.target.checked ? 'включены' : 'выключены'}`);
        });
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.settings.background = theme;
                this.saveSettings();
                this.changeBackground(theme);
                
                document.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                this.showNotification('Фон изменен');
            });
        });
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.settings.difficulty = difficulty;
                this.saveSettings();
                
                document.querySelectorAll('.difficulty-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.showNotification(`Сложность: ${btn.textContent}`);
            });
        });
        
        document.getElementById('soundToggle').checked = this.settings.soundEnabled;
        document.getElementById('musicToggle').checked = this.settings.musicEnabled;
        document.getElementById('animationsToggle').checked = this.settings.animationsEnabled;
        document.getElementById('musicSelect').value = this.currentMusicType;
        
        document.querySelectorAll('.theme-option').forEach(opt => {
            if (opt.dataset.theme === this.settings.background) {
                opt.classList.add('active');
            }
        });
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            if (btn.dataset.difficulty === this.settings.difficulty) {
                btn.classList.add('active');
            }
        });
    }

    initSounds() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.sounds.click = {
                play: () => {
                    if (!this.settings.soundEnabled || !this.audioContext) return;
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = 800;
                    gain.gain.value = 0.1;
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.1);
                }
            };
            
            this.sounds.eat = {
                play: () => {
                    if (!this.settings.soundEnabled || !this.audioContext) return;
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = 600;
                    gain.gain.value = 0.1;
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.2);
                }
            };
            
            this.sounds.explosion = {
                play: () => {
                    if (!this.settings.soundEnabled || !this.audioContext) return;
                    const osc1 = this.audioContext.createOscillator();
                    const osc2 = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc1.type = 'sawtooth';
                    osc2.type = 'triangle';
                    osc1.frequency.value = 150;
                    osc2.frequency.value = 100;
                    gain.gain.value = 0.2;
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc1.start();
                    osc2.start();
                    osc1.stop(this.audioContext.currentTime + 0.5);
                    osc2.stop(this.audioContext.currentTime + 0.5);
                }
            };
            
            this.sounds.win = {
                play: () => {
                    if (!this.settings.soundEnabled || !this.audioContext) return;
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((freq, i) => {
                        setTimeout(() => {
                            const osc = this.audioContext.createOscillator();
                            const gain = this.audioContext.createGain();
                            osc.type = 'sine';
                            osc.frequency.value = freq;
                            gain.gain.value = 0.1;
                            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                            osc.connect(gain);
                            gain.connect(this.audioContext.destination);
                            osc.start();
                            osc.stop(this.audioContext.currentTime + 0.3);
                        }, i * 150);
                    });
                }
            };
            
            this.sounds.gameOver = {
                play: () => {
                    if (!this.settings.soundEnabled || !this.audioContext) return;
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.value = 200;
                    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
                    gain.gain.value = 0.2;
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.5);
                }
            };
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    getMusicNotes(type) {
        const melodies = {
            piano: [
                { note: 261.63, duration: 0.5 }, { note: 293.66, duration: 0.5 },
                { note: 329.63, duration: 0.5 }, { note: 349.23, duration: 0.5 },
                { note: 392.00, duration: 1.0 }, { note: 392.00, duration: 1.0 },
                { note: 349.23, duration: 0.5 }, { note: 329.63, duration: 0.5 },
                { note: 293.66, duration: 0.5 }, { note: 261.63, duration: 1.0 },
                { note: 261.63, duration: 1.0 }, { note: 261.63, duration: 0.5 },
                { note: 329.63, duration: 0.5 }, { note: 392.00, duration: 0.5 },
                { note: 523.25, duration: 1.0 }, { note: 493.88, duration: 0.5 },
                { note: 440.00, duration: 0.5 }, { note: 392.00, duration: 0.5 },
                { note: 349.23, duration: 0.5 }, { note: 329.63, duration: 1.0 },
                { note: 293.66, duration: 0.5 }, { note: 261.63, duration: 1.0 }
            ],
            
            lofi: [
                { note: 220.00, duration: 0.5 }, { note: 246.94, duration: 0.5 },
                { note: 261.63, duration: 0.5 }, { note: 293.66, duration: 0.5 },
                { note: 329.63, duration: 1.0 }, { note: 293.66, duration: 0.5 },
                { note: 329.63, duration: 0.5 }, { note: 349.23, duration: 0.5 },
                { note: 392.00, duration: 1.0 }, { note: 349.23, duration: 0.5 },
                { note: 329.63, duration: 0.5 }, { note: 293.66, duration: 0.5 },
                { note: 261.63, duration: 1.0 }, { note: 220.00, duration: 0.5 },
                { note: 246.94, duration: 0.5 }, { note: 261.63, duration: 0.5 },
                { note: 293.66, duration: 0.5 }, { note: 261.63, duration: 0.5 },
                { note: 220.00, duration: 0.5 }, { note: 196.00, duration: 1.0 }
            ],
            
            ambient: [
                { note: 110.00, duration: 2.0 }, { note: 123.47, duration: 2.0 },
                { note: 130.81, duration: 2.0 }, { note: 146.83, duration: 2.0 },
                { note: 164.81, duration: 2.0 }, { note: 174.61, duration: 2.0 },
                { note: 196.00, duration: 2.0 }, { note: 220.00, duration: 2.0 },
                { note: 246.94, duration: 2.0 }, { note: 261.63, duration: 2.0 }
            ],
            
            guitar: [
                { note: 82.41, duration: 0.5 }, { note: 110.00, duration: 0.5 },
                { note: 146.83, duration: 0.5 }, { note: 196.00, duration: 0.5 },
                { note: 246.94, duration: 0.5 }, { note: 329.63, duration: 1.0 },
                { note: 293.66, duration: 0.5 }, { note: 261.63, duration: 0.5 },
                { note: 220.00, duration: 0.5 }, { note: 196.00, duration: 1.0 },
                { note: 164.81, duration: 0.5 }, { note: 146.83, duration: 0.5 },
                { note: 123.47, duration: 0.5 }, { note: 110.00, duration: 0.5 },
                { note: 82.41, duration: 1.0 }, { note: 110.00, duration: 0.5 },
                { note: 146.83, duration: 0.5 }, { note: 164.81, duration: 0.5 },
                { note: 196.00, duration: 0.5 }, { note: 220.00, duration: 0.5 },
                { note: 246.94, duration: 0.5 }, { note: 261.63, duration: 0.5 }
            ],
            
            synthwave: [
                { note: 65.41, duration: 0.5 }, { note: 82.41, duration: 0.5 },
                { note: 98.00, duration: 0.5 }, { note: 130.81, duration: 0.5 },
                { note: 164.81, duration: 0.5 }, { note: 196.00, duration: 0.5 },
                { note: 261.63, duration: 1.0 }, { note: 246.94, duration: 0.5 },
                { note: 220.00, duration: 0.5 }, { note: 196.00, duration: 0.5 },
                { note: 164.81, duration: 0.5 }, { note: 130.81, duration: 0.5 },
                { note: 98.00, duration: 0.5 }, { note: 82.41, duration: 0.5 },
                { note: 65.41, duration: 1.0 }, { note: 82.41, duration: 0.5 },
                { note: 98.00, duration: 0.5 }, { note: 130.81, duration: 0.5 },
                { note: 164.81, duration: 0.5 }, { note: 196.00, duration: 0.5 },
                { note: 220.00, duration: 0.5 }, { note: 246.94, duration: 0.5 },
                { note: 261.63, duration: 1.0 }
            ]
        };
        
        return melodies[type] || melodies.piano;
    }

    startMusic() {
        if (!this.settings.musicEnabled || !this.audioContext) return;
        
        this.stopMusic();
        
        const notes = this.getMusicNotes(this.currentMusicType);
        let noteIndex = 0;
        
        this.showMusicIndicator();
        
        const playNextNote = () => {
            if (!this.settings.musicEnabled || !this.audioContext) return;
            
            const note = notes[noteIndex % notes.length];
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            const waveTypes = {
                piano: 'sine',
                lofi: 'triangle',
                ambient: 'sine',
                guitar: 'sawtooth',
                synthwave: 'square'
            };
            
            osc.type = waveTypes[this.currentMusicType] || 'sine';
            osc.frequency.value = note.note;
            gain.gain.value = 0.05;
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + note.duration);
            
            noteIndex++;
            
            const nextDelay = note.duration * 1000;
            this.musicTimeout = setTimeout(playNextNote, nextDelay);
        };
        
        this.musicTimeout = setTimeout(playNextNote, 100);
    }

    stopMusic() {
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
        this.hideMusicIndicator();
    }

    showMusicIndicator() {
        this.hideMusicIndicator();
        
        const musicNames = {
            piano: '🎹 Расслабляющее пианино',
            lofi: '☕ Lo-Fi часы',
            ambient: '🌌 Космический эмбиент',
            guitar: '🎸 Акустическая гитара',
            synthwave: '🌆 Синтвейв'
        };
        
        this.musicIndicator = document.createElement('div');
        this.musicIndicator.className = 'music-indicator';
        this.musicIndicator.innerHTML = `🎵 ${musicNames[this.currentMusicType]}`;
        document.body.appendChild(this.musicIndicator);
    }

    hideMusicIndicator() {
        if (this.musicIndicator) {
            this.musicIndicator.remove();
            this.musicIndicator = null;
        }
    }

    initMusic() {
        if (this.settings.musicEnabled) {
            setTimeout(() => this.startMusic(), 1000);
        }
    }

    toggleSettings() {
        const menu = document.getElementById('mainMenu');
        const settings = document.getElementById('settingsPanel');
        
        if (settings.style.display === 'none' || !settings.style.display) {
            menu.style.display = 'none';
            settings.style.display = 'block';
            this.sounds.click?.play();
        } else {
            menu.style.display = 'block';
            settings.style.display = 'none';
            this.sounds.click?.play();
        }
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.changeBackground(this.settings.background);
    }

    changeBackground(theme) {
        document.body.className = `theme-${theme}`;
    }

    showNotification(message) {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            const oldNotif = document.querySelector('.notification');
            if (oldNotif) oldNotif.remove();
        }
        
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;
        document.body.appendChild(notif);
        
        this.notificationTimeout = setTimeout(() => {
            notif.remove();
            this.notificationTimeout = null;
        }, 3000);
    }

    createParticles(x, y, color = '#ff6b6b', count = 10) {
        if (!this.settings.animationsEnabled) return;
        
        const area = document.getElementById('gameArea');
        const rect = area.getBoundingClientRect();
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = (x - rect.left) + 'px';
            particle.style.top = (y - rect.top) + 'px';
            particle.style.background = color;
            particle.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
            particle.style.setProperty('--y', (Math.random() - 0.5) * 100 + 'px');
            area.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    updateCombo(points = 1) {
        this.combo += points;
        
        if (this.combo > 1) {
            const comboDiv = document.createElement('div');
            comboDiv.className = 'combo-counter';
            comboDiv.textContent = `x${this.combo} COMBO!`;
            document.getElementById('gameArea').appendChild(comboDiv);
            setTimeout(() => comboDiv.remove(), 500);
            
            return Math.floor(points * (1 + this.combo * 0.1));
        }
        
        return points;
    }

    resetCombo() {
        this.combo = 0;
    }

    startGame(game) {
        this.currentGame = game;
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('settingsPanel').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('gameTitle').textContent = this.getGameTitle(game);
        this.resetScore();
        this.resetCombo();
        
        this.applyDifficulty(game);
        
        if (this.currentGameInstance) {
            this.currentGameInstance.stop();
            this.currentGameInstance = null;
        }
        
        const games = {
            tetris: Tetris,
            minesweeper: Minesweeper,
            hangman: Hangman,
            snake: Snake,
            racing: Racing
        };
        
        this.currentGameInstance = new games[game]();
        window.currentGameInstance = this.currentGameInstance;
        
        this.sounds.click?.play();
    }

    applyDifficulty(game) {
        const diff = this.settings.difficulty;
        const diffSettings = CONFIG.difficultySettings[diff];
        
        if (diffSettings && diffSettings[game]) {
            Object.assign(CONFIG[game], diffSettings[game]);
        }
    }

    getGameTitle(game) {
        const titles = {
            tetris: '🧩 Тетрис',
            minesweeper: '💣 Сапер',
            hangman: '🪢 Виселица',
            snake: '🐍 Змейка',
            racing: '🏎️ ГОНКИ: НА ПРЕДЕЛЕ'
        };
        return titles[game];
    }

    showMenu() {
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('settingsPanel').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('gameArea').innerHTML = '';
        
        if (this.currentGameInstance) {
            this.currentGameInstance.stop();
            this.currentGameInstance = null;
        }
        window.currentGameInstance = null;
        this.sounds.click?.play();
    }

    updateScore(points) {
        const bonusPoints = this.updateCombo(1);
        this.score += Math.floor(points * bonusPoints);
        document.getElementById('scoreDisplay').textContent = `Счет: ${this.score}`;
        
        const scoreEl = document.getElementById('scoreDisplay');
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => scoreEl.style.transform = 'scale(1)', 200);
        
        return Math.floor(points * bonusPoints);
    }

    resetScore() {
        this.score = 0;
        document.getElementById('scoreDisplay').textContent = 'Счет: 0';
    }
}

class GameBase {
    constructor() {
        this.gameOver = false;
        this.gameLoop = null;
        this.handlers = [];
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.handlers.forEach(({el, event, handler}) => {
            if (el) {
                el.removeEventListener(event, handler);
            }
        });
        this.handlers = [];
        this.gameOver = true;
    }

    addHandler(el, event, handler) {
        if (el) {
            el.addEventListener(event, handler);
            this.handlers.push({el, event, handler});
        }
    }

    showGameOver(message, score = gameManager.score) {
        const existingOverlay = document.querySelector('.game-over');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const area = document.getElementById('gameArea');
        const div = document.createElement('div');
        div.className = 'game-over';
        div.innerHTML = `
            <h2>${message}</h2>
            <p>Счет: ${score}</p>
            <p>Комбо: x${gameManager.combo}</p>
            <button class="restart-btn">🔄 Играть снова</button>
        `;
        area.appendChild(div);
        
        const restartBtn = div.querySelector('.restart-btn');
        restartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.restart();
        });
        
        if (message.includes('Победа') || message.includes('🎉')) {
            gameManager.sounds.win?.play();
        } else {
            gameManager.sounds.gameOver?.play();
        }
        
        const rect = area.getBoundingClientRect();
        gameManager.createParticles(rect.width / 2 + rect.left, rect.height / 2 + rect.top, '#ff6b6b', 20);
    }

    restart() {
        const gameOverlay = document.querySelector('.game-over');
        if (gameOverlay) {
            gameOverlay.remove();
        }
        
        this.stop();
        
        const GameClass = this.constructor;
        if (gameManager.currentGameInstance) {
            gameManager.currentGameInstance.stop();
        }
        gameManager.currentGameInstance = new GameClass();
        window.currentGameInstance = gameManager.currentGameInstance;
        
        gameManager.resetCombo();
        gameManager.sounds.click?.play();
    }
}

class Tetris extends GameBase {
    constructor() {
        super();
        this.grid = Array(CONFIG.tetris.height).fill().map(() => Array(CONFIG.tetris.width).fill(0));
        this.currentPiece = null;
        this.init();
    }

    init() {
        document.getElementById('gameArea').innerHTML = '<div class="tetris-grid" id="tetrisGrid"></div>';
        this.createGrid();
        this.spawnPiece();
        this.gameLoop = setInterval(() => this.movePiece(0, 1), CONFIG.tetris.speed || 500);
        this.addHandler(document, 'keydown', (e) => this.handleKey(e));
    }

    createGrid() {
        const grid = document.getElementById('tetrisGrid');
        grid.style.gridTemplateColumns = `repeat(${CONFIG.tetris.width}, 25px)`;
        grid.innerHTML = '';
        
        for (let y = 0; y < CONFIG.tetris.height; y++) {
            for (let x = 0; x < CONFIG.tetris.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                cell.id = `tetris-${y}-${x}`;
                grid.appendChild(cell);
            }
        }
    }

    spawnPiece() {
        const idx = Math.floor(Math.random() * CONFIG.tetris.pieces.length);
        this.currentPiece = {
            shape: JSON.parse(JSON.stringify(CONFIG.tetris.pieces[idx])),
            color: CONFIG.tetris.colors[idx],
            x: Math.floor(CONFIG.tetris.width / 2) - 1,
            y: 0
        };
        
        if (this.checkCollision()) this.gameOver();
        else this.updateDisplay();
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= CONFIG.tetris.height || nx < 0 || nx >= CONFIG.tetris.width || 
                        ny < 0 || (ny >= 0 && this.grid[ny] && this.grid[ny][nx])) return true;
                }
            }
        }
        return false;
    }

    mergePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= 0 && ny < CONFIG.tetris.height) this.grid[ny][nx] = 1;
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let cleared = 0;
        for (let y = CONFIG.tetris.height - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell === 1)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(CONFIG.tetris.width).fill(0));
                y++;
                cleared++;
            }
        }
        if (cleared) {
            gameManager.updateScore(cleared * 100);
            gameManager.sounds.eat?.play();
        }
        this.updateDisplay();
    }

    movePiece(dx, dy) {
        if (this.gameOver) return;
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            if (dy > 0) this.mergePiece();
        }
        this.updateDisplay();
    }

    rotatePiece() {
        if (this.gameOver) return;
        const rotated = this.currentPiece.shape[0].map((_, i) => 
            this.currentPiece.shape.map(row => row[i]).reverse());
        const original = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        if (this.checkCollision()) this.currentPiece.shape = original;
        else gameManager.sounds.click?.play();
        this.updateDisplay();
    }

    updateDisplay() {
        for (let y = 0; y < CONFIG.tetris.height; y++) {
            for (let x = 0; x < CONFIG.tetris.width; x++) {
                const cell = document.getElementById(`tetris-${y}-${x}`);
                if (cell) {
                    cell.className = 'tetris-cell';
                    if (this.grid[y][x]) cell.classList.add('filled');
                }
            }
        }
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const ny = this.currentPiece.y + y;
                    const nx = this.currentPiece.x + x;
                    if (ny >= 0 && ny < CONFIG.tetris.height && nx >= 0 && nx < CONFIG.tetris.width) {
                        const cell = document.getElementById(`tetris-${ny}-${nx}`);
                        if (cell) cell.classList.add('filled');
                    }
                }
            }
        }
    }

    handleKey(e) {
        if (gameManager.currentGame !== 'tetris' || this.gameOver) return;
        e.preventDefault();
        
        const actions = {
            'ArrowLeft': () => this.movePiece(-1, 0),
            'ArrowRight': () => this.movePiece(1, 0),
            'ArrowDown': () => this.movePiece(0, 1),
            'ArrowUp': () => this.rotatePiece(),
            ' ': () => {
                while (!this.checkCollision()) this.currentPiece.y++;
                this.currentPiece.y--;
                this.mergePiece();
            }
        };
        
        if (actions[e.key]) actions[e.key]();
    }

    gameOver() {
        this.gameOver = true;
        clearInterval(this.gameLoop);
        this.showGameOver('Игра окончена!');
    }
}

class Minesweeper extends GameBase {
    constructor() {
        super();
        this.grid = Array(CONFIG.minesweeper.height).fill().map(() => Array(CONFIG.minesweeper.width).fill(0));
        this.revealed = Array(CONFIG.minesweeper.height).fill().map(() => Array(CONFIG.minesweeper.width).fill(false));
        this.flags = Array(CONFIG.minesweeper.height).fill().map(() => Array(CONFIG.minesweeper.width).fill(false));
        this.mines = CONFIG.minesweeper.mines;
        this.init();
    }

    init() {
        document.getElementById('gameArea').innerHTML = '<div class="minesweeper-grid" id="minesweeperGrid"></div>';
        this.placeMines();
        this.calculateNumbers();
        this.render();
        
        const grid = document.getElementById('minesweeperGrid');
        this.addHandler(grid, 'click', (e) => {
            if (!e.target.classList.contains('minesweeper-cell')) return;
            const x = parseInt(e.target.dataset.x);
            const y = parseInt(e.target.dataset.y);
            this.reveal(x, y);
        });
        
        this.addHandler(grid, 'contextmenu', (e) => {
            e.preventDefault();
            if (!e.target.classList.contains('minesweeper-cell')) return;
            const x = parseInt(e.target.dataset.x);
            const y = parseInt(e.target.dataset.y);
            this.toggleFlag(x, y);
        });
    }

    placeMines() {
        let placed = 0;
        while (placed < this.mines) {
            const x = Math.floor(Math.random() * CONFIG.minesweeper.width);
            const y = Math.floor(Math.random() * CONFIG.minesweeper.height);
            if (this.grid[y][x] !== -1) {
                this.grid[y][x] = -1;
                placed++;
            }
        }
    }

    calculateNumbers() {
        for (let y = 0; y < CONFIG.minesweeper.height; y++) {
            for (let x = 0; x < CONFIG.minesweeper.width; x++) {
                if (this.grid[y][x] === -1) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < CONFIG.minesweeper.height && 
                            nx >= 0 && nx < CONFIG.minesweeper.width && 
                            this.grid[ny][nx] === -1) count++;
                    }
                }
                this.grid[y][x] = count;
            }
        }
    }

    render() {
        const grid = document.getElementById('minesweeperGrid');
        grid.style.gridTemplateColumns = `repeat(${CONFIG.minesweeper.width}, 30px)`;
        grid.innerHTML = '';
        
        for (let y = 0; y < CONFIG.minesweeper.height; y++) {
            for (let x = 0; x < CONFIG.minesweeper.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'minesweeper-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                if (this.revealed[y][x]) {
                    cell.classList.add('revealed');
                    if (this.grid[y][x] === -1) cell.classList.add('mine');
                    else if (this.grid[y][x] > 0) cell.textContent = this.grid[y][x];
                } else if (this.flags[y][x]) {
                    cell.classList.add('flag');
                }
                grid.appendChild(cell);
            }
        }
    }

    reveal(x, y) {
        if (this.gameOver || this.revealed[y][x] || this.flags[y][x]) return;
        
        this.revealed[y][x] = true;
        
        if (this.grid[y][x] === -1) {
            this.gameLose();
            return;
        }
        
        if (this.grid[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy, nx = x + dx;
                    if (ny >= 0 && ny < CONFIG.minesweeper.height && 
                        nx >= 0 && nx < CONFIG.minesweeper.width && !this.revealed[ny][nx]) {
                        this.reveal(nx, ny);
                    }
                }
            }
        }
        
        this.render();
        this.checkWin();
        gameManager.sounds.click?.play();
    }

    toggleFlag(x, y) {
        if (this.gameOver || this.revealed[y][x]) return;
        this.flags[y][x] = !this.flags[y][x];
        this.render();
        gameManager.sounds.click?.play();
    }

    gameLose() {
        this.gameOver = true;
        
        for (let y = 0; y < CONFIG.minesweeper.height; y++) {
            for (let x = 0; x < CONFIG.minesweeper.width; x++) {
                if (this.grid[y][x] === -1) {
                    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (cell) {
                        cell.classList.add('mine');
                    }
                }
            }
        }
        
        gameManager.sounds.explosion?.play();
        const rect = document.getElementById('minesweeperGrid').getBoundingClientRect();
        gameManager.createParticles(rect.width / 2 + rect.left, rect.height / 2 + rect.top, '#ff0000', 30);
        
        setTimeout(() => {
            this.showGameOver('💥 Вы проиграли!');
        }, 500);
    }

    checkWin() {
        let correct = 0;
        for (let y = 0; y < CONFIG.minesweeper.height; y++) {
            for (let x = 0; x < CONFIG.minesweeper.width; x++) {
                if (this.grid[y][x] === -1 && this.flags[y][x]) correct++;
            }
        }
        if (correct === this.mines) {
            gameManager.updateScore(500);
            this.showGameOver('🎉 Победа!');
        }
    }
}

class Hangman extends GameBase {
    constructor() {
        super();
        this.word = CONFIG.hangman.words[Math.floor(Math.random() * CONFIG.hangman.words.length)];
        this.guessed = new Set();
        this.attempts = 0;
        this.maxAttempts = CONFIG.hangman.maxAttempts;
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        const area = document.getElementById('gameArea');
        area.innerHTML = `
            <div class="hangman-container">
                <div class="hangman-drawing" id="hangmanDrawing">${this.getHangmanDrawing()}</div>
                <div>
                    <div class="hangman-word">${this.getWordDisplay()}</div>
                    <div class="hangman-keyboard" id="hangmanKeyboard"></div>
                </div>
            </div>
        `;
        this.renderKeyboard();
    }

    getHangmanDrawing() {
        const stages = [
            '\n    +---+\n    |   |\n        |\n        |\n        |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n        |\n        |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n    |   |\n        |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n   /|   |\n        |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n   /|\\  |\n        |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n   /|\\  |\n   /    |\n        |\n=========',
            '\n    +---+\n    |   |\n    O   |\n   /|\\  |\n   / \\  |\n        |\n========='
        ];
        return stages[this.attempts];
    }

    getWordDisplay() {
        return this.word.split('').map(l => 
            `<div class="hangman-letter">${this.guessed.has(l) ? l : ''}</div>`
        ).join('');
    }

    renderKeyboard() {
        const keyboard = document.getElementById('hangmanKeyboard');
        keyboard.innerHTML = '';
        'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('').forEach(letter => {
            const btn = document.createElement('button');
            btn.className = `hangman-key ${this.guessed.has(letter) ? 'used' : ''}`;
            btn.textContent = letter;
            btn.addEventListener('click', () => this.guess(letter));
            keyboard.appendChild(btn);
        });
    }

    guess(letter) {
        if (this.gameOver || this.guessed.has(letter) || this.attempts >= this.maxAttempts) return;
        
        this.guessed.add(letter);
        
        if (!this.word.includes(letter)) {
            this.attempts++;
            gameManager.sounds.click?.play();
        } else {
            gameManager.sounds.eat?.play();
        }
        
        this.render();
        this.checkGameStatus();
    }

    checkGameStatus() {
        if (this.word.split('').every(l => this.guessed.has(l))) {
            this.gameOver = true;
            gameManager.updateScore(300);
            this.showGameOver('🎉 Вы выиграли!');
        } else if (this.attempts >= this.maxAttempts) {
            this.gameOver = true;
            this.showGameOver(`💀 Вы проиграли! Слово: ${this.word}`);
        }
    }
}

class Snake extends GameBase {
    constructor() {
        super();
        this.snake = [
            {x: 10, y: 7},
            {x: 9, y: 7},
            {x: 8, y: 7}
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.baseSpeed = CONFIG.snake.baseSpeed || 150;
        this.speed = this.baseSpeed;
        this.speedIncrease = CONFIG.snake.speedIncrease || 5;
        this.maxSpeed = CONFIG.snake.maxSpeed || 80;
        this.init();
    }

    init() {
        const area = document.getElementById('gameArea');
        area.innerHTML = '<div class="snake-grid" id="snakeGrid"></div>';
        
        const grid = document.getElementById('snakeGrid');
        grid.style.gridTemplateColumns = `repeat(${CONFIG.snake.width}, 20px)`;
        grid.innerHTML = '';
        
        for (let y = 0; y < CONFIG.snake.height; y++) {
            for (let x = 0; x < CONFIG.snake.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'snake-cell';
                cell.id = `snake-${y}-${x}`;
                grid.appendChild(cell);
            }
        }
        
        this.spawnFood();
        this.gameLoop = setInterval(() => this.move(), this.speed);
        this.addHandler(document, 'keydown', (e) => this.handleKey(e));
    }

    spawnFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * CONFIG.snake.width),
                y: Math.floor(Math.random() * CONFIG.snake.height)
            };
        } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y));
        this.updateDisplay();
    }

    move() {
        if (this.gameOver) return;
        
        this.direction = this.nextDirection;
        const head = {x: this.snake[0].x, y: this.snake[0].y};
        
        switch(this.direction) {
            case 'right': head.x++; break;
            case 'left': head.x--; break;
            case 'up': head.y--; break;
            case 'down': head.y++; break;
        }
        
        if (head.x < 0 || head.x >= CONFIG.snake.width || 
            head.y < 0 || head.y >= CONFIG.snake.height) {
            this.gameOver = true;
            clearInterval(this.gameLoop);
            this.showGameOver('Игра окончена!');
            return;
        }
        
        if (this.snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)) {
            this.gameOver = true;
            clearInterval(this.gameLoop);
            this.showGameOver('Игра окончена!');
            return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            gameManager.updateScore(50);
            gameManager.sounds.eat?.play();
            
            const rect = document.getElementById('snakeGrid').getBoundingClientRect();
            gameManager.createParticles(
                this.food.x * 20 + rect.left + 10,
                this.food.y * 20 + rect.top + 10,
                '#00ff00',
                5
            );
            
            this.spawnFood();
            this.speed = Math.max(this.maxSpeed, this.speed - this.speedIncrease);
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.move(), this.speed);
        } else {
            this.snake.pop();
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        for (let y = 0; y < CONFIG.snake.height; y++) {
            for (let x = 0; x < CONFIG.snake.width; x++) {
                const cell = document.getElementById(`snake-${y}-${x}`);
                if (cell) {
                    cell.className = 'snake-cell';
                }
            }
        }
        
        this.snake.forEach((segment, index) => {
            const cell = document.getElementById(`snake-${segment.y}-${segment.x}`);
            if (cell) {
                cell.classList.add('snake');
                if (index === 0) {
                    cell.classList.add('head');
                }
            }
        });
        
        const foodCell = document.getElementById(`snake-${this.food.y}-${this.food.x}`);
        if (foodCell) {
            foodCell.classList.add('food');
        }
    }

    handleKey(e) {
        if (gameManager.currentGame !== 'snake' || this.gameOver) return;
        
        const keyDirection = {
            'ArrowRight': 'right',
            'ArrowLeft': 'left',
            'ArrowUp': 'up',
            'ArrowDown': 'down'
        }[e.key];
        
        if (keyDirection) {
            e.preventDefault();
            
            if ((this.direction === 'right' && keyDirection === 'left') ||
                (this.direction === 'left' && keyDirection === 'right') ||
                (this.direction === 'up' && keyDirection === 'down') ||
                (this.direction === 'down' && keyDirection === 'up')) {
                return;
            }
            
            this.nextDirection = keyDirection;
        }
    }
}

class Racing extends GameBase {
    constructor() {
        super();
        this.playerX = (CONFIG.racing.roadWidth - CONFIG.racing.playerWidth) / 2;
        this.obstacles = [];
        this.speed = CONFIG.racing.baseSpeed || 3;
        this.boost = 100;
        this.boosting = false;
        this.score = 0;
        this.keys = {};
        this.init();
    }

    init() {
        const area = document.getElementById('gameArea');
        area.innerHTML = `
            <div class="racing-container" id="racingContainer">
                <div class="racing-road"></div>
                <div class="racing-markings">
                    <div class="racing-lane"></div>
                    <div class="racing-lane-dashed"></div>
                </div>
                <div class="racing-speedometer" id="speedometer">${Math.round(this.speed * 20)} км/ч</div>
                <div class="racing-score" id="racingScore">Счет: 0</div>
                <div class="racing-boost">
                    <div class="racing-boost-fill" id="boostFill" style="width:100%"></div>
                </div>
                <div class="racing-player" style="left:${this.playerX}px">
                    <div class="racing-player-window"></div>
                </div>
            </div>
        `;
        
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        this.spawnTimer = setInterval(() => this.spawnObstacle(), CONFIG.racing.spawnRate || 800);
        this.difficultyTimer = setInterval(() => {
            if (!this.gameOver && this.speed < (CONFIG.racing.maxSpeed || 10)) {
                this.speed = Math.min(CONFIG.racing.maxSpeed || 10, this.speed + 0.5);
            }
        }, CONFIG.racing.difficultyIncrease || 10000);
        
        this.addHandler(document, 'keydown', (e) => this.keys[e.key] = true);
        this.addHandler(document, 'keyup', (e) => this.keys[e.key] = false);
    }

    spawnObstacle() {
        if (this.gameOver) return;
        
        const types = ['car', 'truck', 'block'];
        const type = types[Math.floor(Math.random() * 3)];
        const sizes = {
            car: [55, 90],
            truck: [65, 120],
            block: [50, 50]
        };
        let [w, h] = sizes[type];
        w += Math.random() * 10 - 5;
        h += Math.random() * 10 - 5;
        
        const x = Math.random() * (CONFIG.racing.roadWidth - w);
        const obstacle = {
            x, y: -h, w, h, type,
            speed: this.speed * (0.8 + Math.random() * 0.4),
            element: this.createObstacle(x, -h, w, h, type)
        };
        
        this.obstacles.push(obstacle);
    }

    createObstacle(x, y, w, h, type) {
        const el = document.createElement('div');
        el.className = `racing-obstacle ${type}`;
        el.style.cssText = `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;
        if (Math.random() > 0.7) el.classList.add('warning');
        document.getElementById('racingContainer').appendChild(el);
        return el;
    }

    update() {
        if (this.gameOver) return;
        
        if (this.keys['ArrowLeft'] && !this.keys['ArrowRight']) {
            this.playerX = Math.max(0, this.playerX - 5);
        }
        if (this.keys['ArrowRight'] && !this.keys['ArrowLeft']) {
            this.playerX = Math.min(CONFIG.racing.roadWidth - CONFIG.racing.playerWidth, this.playerX + 5);
        }
        
        if (this.keys[' '] && this.boost > 0) {
            if (!this.boosting) {
                gameManager.sounds.click?.play();
            }
            this.boosting = true;
            this.boost = Math.max(0, this.boost - 1);
            this.speed = (CONFIG.racing.baseSpeed || 3) * 1.5;
        } else {
            this.boosting = false;
            this.boost = Math.min(100, this.boost + 0.2);
            this.speed = Math.max(CONFIG.racing.baseSpeed || 3, this.speed - 0.1);
        }
        
        const player = document.querySelector('.racing-player');
        if (player) {
            player.style.left = this.playerX + 'px';
        }
        
        const boostFill = document.getElementById('boostFill');
        if (boostFill) {
            boostFill.style.width = this.boost + '%';
        }
        
        this.obstacles.forEach((obs, index) => {
            obs.y += obs.speed;
            if (obs.element) {
                obs.element.style.top = obs.y + 'px';
            }
            
            if (obs.y > CONFIG.racing.roadHeight) {
                if (obs.element) {
                    obs.element.remove();
                }
                this.obstacles.splice(index, 1);
                this.score += 10;
                const racingScore = document.getElementById('racingScore');
                if (racingScore) {
                    racingScore.textContent = `Счет: ${this.score}`;
                }
                gameManager.updateScore(10);
            }
            
            const playerRect = {
                x: this.playerX,
                y: CONFIG.racing.roadHeight - CONFIG.racing.playerHeight - 20,
                w: CONFIG.racing.playerWidth,
                h: CONFIG.racing.playerHeight
            };
            
            if (playerRect.x < obs.x + obs.w &&
                playerRect.x + playerRect.w > obs.x &&
                playerRect.y < obs.y + obs.h &&
                playerRect.y + playerRect.h > obs.y) {
                this.crash(obs);
            }
        });
        
        const speedometer = document.getElementById('speedometer');
        if (speedometer) {
            speedometer.textContent = `${Math.round(this.speed * 20)} км/ч ${this.boosting ? '🚀' : ''}`;
        }
    }

    crash(obs) {
        this.gameOver = true;
        clearInterval(this.gameLoop);
        clearInterval(this.spawnTimer);
        clearInterval(this.difficultyTimer);
        
        gameManager.sounds.explosion?.play();
        
        const container = document.getElementById('racingContainer');
        const rect = container.getBoundingClientRect();
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'racing-particle';
            particle.style.left = (obs.x + obs.w/2) + 'px';
            particle.style.top = (obs.y + obs.h/2) + 'px';
            particle.style.setProperty('--x', (Math.random() - 0.5) * 200 + 'px');
            particle.style.setProperty('--y', (Math.random() - 0.5) * 200 + 'px');
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
        
        setTimeout(() => {
            this.showGameOver('🏁 ГОНКА ЗАВЕРШЕНА 🏁', this.score);
        }, 500);
    }

    stop() {
        super.stop();
        clearInterval(this.spawnTimer);
        clearInterval(this.difficultyTimer);
        this.obstacles.forEach(obs => {
            if (obs.element) obs.element.remove();
        });
        this.obstacles = [];
    }
}

const gameManager = new GameManager();
window.gameManager = gameManager;