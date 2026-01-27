// game.js - ПОЛНЫЙ КОД С ТАБЛИЦЕЙ ЛИДЕРОВ + 3x3 ГРИД
class PerelivaykaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.config = window.GAME_CONFIG;
        
        this.state = {
            screen: 'start',
            timeLeft: this.config.TIME_LIMIT,
            moves: 0,
            gameActive: false,
            selectedTube: null,
            tubes: [],
            history: []
        };

        // ✅ ЛИДЕРЫ
        this.bestScore = parseInt(localStorage.getItem('perelivayka_best')) || 0;
        this.leaderboard = JSON.parse(localStorage.getItem('perelivayka_leaderboard')) || [];

        this.initCanvas();
        this.bindEvents();
        this.updateDisplay();
    }

    initCanvas() {
        const resizeCanvas = () => {
            const size = Math.min(window.innerWidth * 0.9, 420);
            this.canvas.width = size;
            this.canvas.height = size * 1.1;
            this.updateMetrics();
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    updateMetrics() {
        this.tubeSize = Math.min(
            (this.canvas.width - 60) / 3,
            (this.canvas.height * 0.7 - 60) / 3
        );
        
        this.tubeWidth = this.tubeSize;
        this.tubeHeight = this.tubeSize * 1.6;
        this.tubeSpacing = 15;
        
        this.startX = (this.canvas.width - (3 * this.tubeWidth + 2 * this.tubeSpacing)) / 2;
        this.startY = (this.canvas.height - (3 * this.tubeHeight + 2 * this.tubeSpacing)) / 2;
    }

    generatePuzzle() {
        this.state.tubes = [];
        this.state.history = [];
        this.state.moves = 0;
        this.state.selectedTube = null;

        const liquids = [];
        for (let i = 0; i < this.config.MAX_COLORS; i++) {
            for (let j = 0; j < 3; j++) {
                liquids.push(i);
            }
        }
        for (let i = 0; i < 9; i++) {
            liquids.push(null, null, null);
        }

        this.shuffle(liquids);
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const tubeLiquids = liquids.splice(0, 3);
                this.state.tubes.push({
                    id: row * 3 + col,
                    row: row,
                    col: col,
                    liquids: tubeLiquids,
                    capacity: 3
                });
            }
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    bindEvents() {
        document.getElementById('start-btn').onclick = () => this.startGame();
        document.getElementById('play-again-btn').onclick = () => this.restartGame();
        document.getElementById('undo-btn').onclick = () => this.undo();
        document.getElementById('restart-btn').onclick = () => this.restartCurrentGame();
        document.getElementById('show-leaderboard-btn').onclick = () => this.showLeaderboard();
        document.getElementById('back-to-menu-btn').onclick = () => this.restartGame();

        this.canvas.ontouchstart = (e) => {
            e.preventDefault();
            this.handleTubeSelect(e.touches[0]);
        };
        
        this.canvas.onclick = (e) => {
            this.handleTubeSelect(e);
        };
    }

    handleTubeSelect(e) {
        if (!this.state.gameActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const tubeX = this.startX + col * (this.tubeWidth + this.tubeSpacing);
                const tubeY = this.startY + row * (this.tubeHeight + this.tubeSpacing);
                
                if (x >= tubeX && x <= tubeX + this.tubeWidth &&
                    y >= tubeY && y <= tubeY + this.tubeHeight) {
                    const tubeIndex = row * 3 + col;
                    console.log('✅ 3x3 clicked:', tubeIndex, `[${row},${col}]`);
                    this.selectTube(tubeIndex);
                    return;
                }
            }
        }
    }

    selectTube(index) {
        const tube = this.state.tubes[index];
        
        if (this.state.selectedTube === null) {
            if (tube.liquids.some(l => l !== null)) {
                this.state.selectedTube = index;
                console.log('✅ Selected FROM:', index);
            }
        } else if (this.state.selectedTube === index) {
            this.state.selectedTube = null;
            console.log('❌ Cleared');
        } else {
            console.log('🔄 Pour FROM', this.state.selectedTube, 'TO', index);
            if (this.pourLiquid(this.state.selectedTube, index)) {
                this.state.selectedTube = null;
            }
        }
        this.updateDisplay();
    }

    pourLiquid(fromIndex, toIndex) {
        const fromTube = this.state.tubes[fromIndex];
        const toTube = this.state.tubes[toIndex];
        
        let topLiquidIndex = -1;
        for (let i = fromTube.liquids.length - 1; i >= 0; i--) {
            if (fromTube.liquids[i] !== null) {
                topLiquidIndex = i;
                break;
            }
        }
        
        if (topLiquidIndex === -1) {
            console.log('❌ No liquid FROM');
            return false;
        }
        
        const topLiquid = fromTube.liquids[topLiquidIndex];

        let toEmptyIndex = -1;
        for (let i = 0; i < toTube.liquids.length; i++) {
            if (toTube.liquids[i] === null) {
                toEmptyIndex = i;
                break;
            }
        }
        
        if (toEmptyIndex === -1) {
            console.log('❌ No space TO');
            return false;
        }

        console.log(`✅ Pour ${topLiquid} ANYWHERE`);

        this.state.history.push(JSON.parse(JSON.stringify(this.state.tubes)));
        this.state.moves++;

        toTube.liquids[toEmptyIndex] = topLiquid;
        fromTube.liquids[topLiquidIndex] = null;

        console.log(`✅ Poured | Moves: ${this.state.moves}`);

        if (this.checkWin()) {
            this.endGame(true);
        }
        return true;
    }

    checkWin() {
        return this.state.tubes.every(tube => {
            const liquids = tube.liquids.filter(l => l !== null);
            return liquids.length === 0 || liquids.every(l => l === liquids[0]);
        });
    }

    undo() {
        if (this.state.history.length > 0 && this.state.gameActive) {
            this.state.tubes = this.state.history.pop();
            this.state.moves--;
            this.state.selectedTube = null;
            this.updateDisplay();
            console.log('↶ Undo - moves:', this.state.moves);
        }
    }

    startGame() {
        this.state.screen = 'game';
        this.state.gameActive = true;
        this.state.timeLeft = this.config.TIME_LIMIT;
        this.generatePuzzle();
        this.updateDisplay();
        this.gameLoop();
        console.log('🚀 3x3 Game started');
    }

    restartCurrentGame() {
        this.state.timeLeft = this.config.TIME_LIMIT;
        this.generatePuzzle();
        this.state.selectedTube = null;
        this.updateDisplay();
        console.log('🔄 Game restarted');
    }

    restartGame() {
        this.state.screen = 'start';
        this.state.gameActive = false;
        this.updateDisplay();
    }

    endGame(won) {
        this.state.gameActive = false;
        const score = won ? 1000 + (this.config.TIME_LIMIT - this.state.timeLeft) * 10 : this.state.moves * 5;
        this.state.score = score;
        this.state.completed = won;
        
        window.gameAPI.sendResult({
            score: score,
            moves: this.state.moves,
            timeLeft: this.state.timeLeft,
            completed: won
        });

        this.state.screen = 'result';
        this.updateResultScreen();
        console.log('🏁 Game ended. Score:', score);
    }

    saveResult() {
        const result = {
            score: this.state.score,
            moves: this.state.moves,
            timeLeft: this.state.timeLeft,
            completed: this.state.completed,
            date: new Date().toLocaleDateString('ru-RU'),
            id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || Date.now().toString()
        };
        
        if (result.score > this.bestScore) {
            this.bestScore = result.score;
            localStorage.setItem('perelivayka_best', this.bestScore);
        }
        
        this.leaderboard.unshift(result);
        this.leaderboard = this.leaderboard.slice(0, 100);
        localStorage.setItem('perelivayka_leaderboard', JSON.stringify(this.leaderboard));
    }

    showLeaderboard() {
        document.getElementById('your-best-score').textContent = this.bestScore;
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        
        this.leaderboard.slice(0, 50).forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            let placeClass = '';
            if (index === 0) placeClass = 'gold';
            else if (index === 1) placeClass = 'silver';
            else if (index === 2) placeClass = 'bronze';
            
            const isYours = result.id === (window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'anonymous');
            if (isYours) {
                item.classList.add('your-result');
            }
            
            item.innerHTML = `
                <span class="place ${placeClass}">${index + 1}.</span>
                <span>${result.score.toLocaleString()}</span>
                <span>${result.moves}</span>
                <span>${result.timeLeft}s</span>
            `;
            list.appendChild(item);
        });
        
        this.state.screen = 'leaderboard';
        this.updateDisplay();
    }

    updateResultScreen() {
        const scoreEl = document.getElementById('result-score');
        const titleEl = document.getElementById('result-title');
        const textEl = document.getElementById('result-text');
        const movesEl = document.getElementById('result-moves');
        const timeEl = document.getElementById('result-time');

        scoreEl.textContent = this.state.score || 0;
        movesEl.textContent = this.state.moves;
        timeEl.textContent = this.state.timeLeft;
        
        if (this.state.completed) {
            titleEl.textContent = '🎉 Решено!';
            textEl.textContent = 'Отличная работа!';
            this.saveResult();
        } else {
            titleEl.textContent = '⏰ Время вышло!';
            textEl.textContent = 'Попробуй ещё раз!';
        }
    }

    gameLoop() {
        if (!this.state.gameActive) return;
        this.state.timeLeft--;
        this.updateDisplay();
        if (this.state.timeLeft <= 0) {
            this.endGame(false);
            return;
        }
        setTimeout(() => this.gameLoop(), 1000);
    }

    updateDisplay() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.toggle('active', screen.id.replace('-screen', '') === this.state.screen);
        });

        if (this.state.screen === 'game') {
            document.querySelector('.time').textContent = this.state.timeLeft;
            document.querySelector('.moves').textContent = this.state.moves;
            document.querySelector('.progress').textContent = `${this.getProgress()}/${this.config.MAX_COLORS}`;
            this.draw();
        }
    }

    getProgress() {
        return this.state.tubes.filter(tube => {
            const liquids = tube.liquids.filter(l => l !== null);
            return liquids.length === 0 || liquids.every(l => l === liquids[0]);
        }).length;
    }

    drawLiquids(tube, x, y, layerHeight) {
        let yOffset = y + this.tubeHeight - 4;
        
        for (let layerIndex = 0; layerIndex < tube.liquids.length; layerIndex++) {
            const colorIndex = tube.liquids[layerIndex];
            if (colorIndex !== null) {
                const gradient = this.ctx.createRadialGradient(
                    x + this.tubeWidth/2, yOffset - layerHeight/2, 1,
                    x + this.tubeWidth/2, yOffset - layerHeight/2, layerHeight/2
                );
                gradient.addColorStop(0, this.config.COLORS[colorIndex]);
                gradient.addColorStop(0.7, this.adjustBrightness(this.config.COLORS[colorIndex], -0.2));
                gradient.addColorStop(1, this.adjustBrightness(this.config.COLORS[colorIndex], -0.4));
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = this.config.COLORS[colorIndex];
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.ctx.roundRect(x + 3, yOffset - layerHeight, this.tubeWidth - 6, layerHeight, [5, 5, 3, 3]);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
                this.ctx.beginPath();
                this.ctx.roundRect(x + 5, yOffset - layerHeight + 2, 2, layerHeight * 0.4, [1, 1, 0, 0]);
                this.ctx.fill();
                
                yOffset -= layerHeight;
            } else {
                yOffset -= layerHeight;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        bgGradient.addColorStop(1, 'rgba(118, 75, 162, 0.9)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
        this.ctx.fillRect(10, this.startY + 3 * (this.tubeHeight + this.tubeSpacing) + 5, 
                         this.canvas.width - 20, 25);

        const layerHeight = this.tubeHeight / 3;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const tube = this.state.tubes[index];
                const x = this.startX + col * (this.tubeWidth + this.tubeSpacing);
                const y = this.startY + row * (this.tubeHeight + this.tubeSpacing);
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x + this.tubeWidth * 0.3, y + this.tubeHeight - 5, 
                                this.tubeWidth * 0.4, 8);
                
                this.ctx.save();
                this.ctx.translate(x + this.tubeWidth/2, y + this.tubeHeight/2);
                this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                this.ctx.strokeStyle = '#ffffff60';
                this.ctx.lineWidth = 1.8;
                this.ctx.shadowColor = 'rgba(255,255,255,0.4)';
                this.ctx.shadowBlur = 5;
                
                this.ctx.beginPath();
                this.ctx.roundRect(-this.tubeWidth/2 + 1.5, -this.tubeHeight/2, 
                                 this.tubeWidth - 3, this.tubeHeight, [6, 6, 6, 6]);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
                this.ctx.restore();

                this.drawLiquids(tube, x, y, layerHeight);

                if (this.state.selectedTube === index) {
                    this.ctx.strokeStyle = '#feca57';
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowColor = '#feca57';
                    this.ctx.shadowBlur = 12;
                    this.ctx.lineJoin = 'round';
                    this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                    this.ctx.roundRect(x - 1, y - 3, this.tubeWidth + 2, this.tubeHeight + 6, 12);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }

    adjustBrightness(color, brightness) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * brightness * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

window.addEventListener('load', () => {
    window.game = new PerelivaykaGame();
});
