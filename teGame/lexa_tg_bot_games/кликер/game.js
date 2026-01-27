class AimTrainer {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.timerEl = document.getElementById('timer');
        this.missesEl = document.getElementById('misses');
        this.accuracyEl = document.getElementById('accuracy');
        this.clickCountEl = document.getElementById('clickCount');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalClicksEl = document.getElementById('finalClicks');
        this.finalMissesEl = document.getElementById('finalMisses');
        this.finalAccuracyEl = document.getElementById('finalAccuracy');
        this.playBtn = document.getElementById('playBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.clickZone = document.getElementById('clickZone');
        
        this.gradientBtns = document.querySelectorAll('.gradient-btn');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.colorMenus = document.querySelectorAll('.color-menu');
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            result: document.getElementById('resultScreen')
        };

        this.init();
    }

    init() {
        this.initGradients();
        this.bindEvents();
        this.reset();
        this.showScreen('start');
    }

    initGradients() {
        const savedGradient = localStorage.getItem('selectedGradient') || '0';
        const savedTab = localStorage.getItem('selectedTab') || 'soft';
        this.setGradient(savedGradient);
        this.setTab(savedTab);
    }

    bindEvents() {
        // Табы
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTab(btn.dataset.tab);
            });
        });

        // Градиенты (исправленная нумерация для двух меню)
        this.gradientBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Определяем базовый ID градиента в зависимости от вкладки
                const currentTab = document.querySelector('.color-menu.active');
                const baseId = currentTab.id === 'softColors' ? 0 : 5;
                const gradientId = (baseId + index).toString();
                this.setGradient(gradientId);
            });
        });

        // Кнопки
        this.playBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restart());
        
        // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ: отслеживание ВСЕХ кликов по экрану
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.elementFromPoint(touch.clientX, touch.clientY).dispatchEvent(mouseEvent);
        });
    }

    setTab(tabName) {
        localStorage.setItem('selectedTab', tabName);
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.colorMenus.forEach(menu => menu.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName + 'Colors').classList.add('active');
    }

    setGradient(id) {
        localStorage.setItem('selectedGradient', id);
        this.gradientBtns.forEach(btn => btn.classList.remove('active'));
        this.gradientBtns[id].classList.add('active');
        document.body.style.background = getComputedStyle(document.documentElement)
            .getPropertyValue(`--gradient-${id}`);
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.remove('hidden');
        this.screens[screenName].classList.add('active');
    }

    reset() {
        this.score = 0;
        this.timeLeft = 60;
        this.clicks = 0;
        this.misses = 0;
        this.gameRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.moveTarget();
    }

    moveTarget() {
        const size = 140;
        const padding = 60;
        const maxX = window.innerWidth - size - padding;
        const maxY = window.innerHeight - size - padding - 120; // HUD
        
        const x = padding + Math.random() * maxX;
        const y = padding + Math.random() * maxY;
        
        this.clickZone.style.left = x + 'px';
        this.clickZone.style.top = y + 'px';
    }

    // ✅ РАБОЧАЯ ЛОГИКА ПРОМАХОВ
    handleClick(e) {
        if (!this.gameRunning) return;
        
        const rect = this.clickZone.getBoundingClientRect();
        const isHit = e.clientX >= rect.left && 
                     e.clientX <= rect.right && 
                     e.clientY >= rect.top && 
                     e.clientY <= rect.bottom;
        
        if (isHit) {
            this.onHit();
        } else {
            this.onMiss();
        }
    }

    onHit() {
        this.score += 1;
        this.clicks++;
        this.updateUI();
        
        // Перемещение цели
        this.clickZone.style.transition = 'none';
        this.moveTarget();
        setTimeout(() => {
            this.clickZone.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 100);
    }

    onMiss() {
        this.misses++;
        this.updateUI();
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.timerEl.textContent = this.timeLeft;
        this.missesEl.textContent = this.misses;
        this.clickCountEl.textContent = this.clicks;
        
        const accuracy = (this.clicks + this.misses) > 0 
            ? Math.round((this.clicks / (this.clicks + this.misses)) * 100) 
            : 100;
        this.accuracyEl.textContent = accuracy + '%';
    }

    startGame() {
        this.reset();
        this.showScreen('game');
        this.updateUI();
        this.startTimer();
    }

    startTimer() {
        this.gameRunning = true;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.gameRunning = false;
        const accuracy = (this.clicks + this.misses) > 0 
            ? Math.round((this.clicks / (this.clicks + this.misses)) * 100) 
            : 100;
        
        this.finalScoreEl.textContent = this.score;
        this.finalClicksEl.textContent = this.clicks;
        this.finalMissesEl.textContent = this.misses;
        this.finalAccuracyEl.textContent = accuracy + '%';
        
        this.showScreen('result');
        
        TelegramAPI.sendGAME_RESULT({
            score: this.score,
            clicks: this.clicks,
            misses: this.misses,
            accuracy: accuracy,
            time_spent: 60,
            gradient: localStorage.getItem('selectedGradient') || '0'
        });
    }

    restart() {
        this.showScreen('start');
        this.reset();
    }
}

const game = new AimTrainer();
