class WeekBusinessGame {
    constructor() {
        try {
            this.api = new GameAPI();
            this.api.setGameRef(this);
        } catch(e) {
            this.api = { hapticFeedback: () => {}, setMainButtonText: () => {}, sendResult: console.log };
        }
        
        this.config = window.GAME_CONFIG;
        this.state = {
            currentDay: 1,
            dayStartMoney: 0,
            money: this.config.START_MONEY,
            time: this.config.TIME_LIMIT,
            record: parseInt(localStorage.getItem('poteryaevka_week_record')) || 100,
            completedDays: 0,
            totalWeeks: parseInt(localStorage.getItem('poteryaevka_total_weeks')) || 0,
            totalCompletedDays: parseInt(localStorage.getItem('poteryaevka_total_days')) || 0,
            dailyQuota: this.config.DAILY_QUOTAS[0],
            upgrades: JSON.parse(JSON.stringify(this.config.UPGRADES)),
            isRunning: false,
            isPaused: false,
            tourists: 0,
            totalVisitors: 0,
            accumulatedIncome: 0
        };
        setTimeout(() => this.init(), 100);
    }

    init() {
        this.bindEvents();
        this.initTheme();
        this.updateOverviewStats();
        this.showScreen('main-menu');
        this.createStars();
    }

    bindEvents() {
        document.getElementById('play-btn').onclick = () => this.startWeek();
        document.getElementById('stats-overview-btn').onclick = () => this.showScreen('stats-overview');
        document.getElementById('back-to-main-btn').onclick = () => this.showScreen('main-menu');
        document.getElementById('exit-btn').onclick = () => {
            if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
            else window.close();
        };

        // 🔥 ТОЛЬКО DLC — БЕЗ РЕЙТИНГА
        document.getElementById('dlc-btn').onclick = () => this.showScreen('dlc');
        document.getElementById('back-to-main-dlc-btn').onclick = () => this.showScreen('main-menu');

        document.getElementById('restart-btn').onclick = () => this.startWeek();
        document.getElementById('menu-btn').onclick = () => {
            this.endWeek();
            this.showScreen('main-menu');
        };
        document.getElementById('pause-btn').onclick = () => this.togglePause();
        document.getElementById('next-day-btn').onclick = () => this.nextDay();
        document.getElementById('retry-day-btn').onclick = () => this.retryDay();
        document.getElementById('submit-leaderboard-btn').onclick = () => this.submitLeaderboard();
        document.getElementById('skip-leaderboard-btn').onclick = () => this.skipLeaderboard();
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => this.switchTab(btn.dataset.tab));
        document.getElementById('game-screen').onclick = (e) => {
            const item = e.target.closest('.upgrade-item');
            if (item && this.state.isRunning && !this.state.isPaused) this.buyUpgrade(item.dataset.type);
        };
    }

    initTheme() {
        const savedTheme = localStorage.getItem('poteryaevka_theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = 'dark';
        if (savedTheme) {
            theme = savedTheme;
        } else if (!systemPrefersDark) {
            theme = 'light';
        }
        
        this.setTheme(theme);
        
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.onclick = () => {
                const newTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            };
        }
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('poteryaevka_theme', theme);
        
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.textContent = theme === 'light' ? '🌙 Темная' : '☀️ Светлая';
        }
    }

    createStars() {
        const existing = document.querySelector('.stars-base');
        if (existing) existing.remove();

        const starsBg = document.createElement('div');
        starsBg.className = 'stars-base';
        
        const starCount = window.innerWidth > 480 ? 150 : 80;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            const size = Math.random() * 3 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const duration = Math.random() * 5 + 3;
            
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${posX}%`;
            star.style.top = `${posY}%`;
            star.style.setProperty('--duration', `${duration}s`);
            
            starsBg.appendChild(star);
        }

        const moon = document.createElement('div');
        moon.className = 'moon-base';

        document.body.prepend(moon);
        document.body.prepend(starsBg);
    }

    startWeek() {
        Object.assign(this.state, {
            currentDay: 1,
            dayStartMoney: this.config.START_MONEY,
            money: this.config.START_MONEY,
            time: this.config.TIME_LIMIT,
            completedDays: 0,
            dailyQuota: this.config.DAILY_QUOTAS[0],
            upgrades: JSON.parse(JSON.stringify(this.config.UPGRADES)),
            isRunning: true,
            isPaused: false,
            tourists: 0,
            totalVisitors: 0,
            accumulatedIncome: 0
        });
        this.updateDisplay();
        this.showScreen('game');
        this.api.setMainButtonText('Пауза');

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        this.gameTimer = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused) return;
            this.state.time--;
            this.addIncomePerSecond();
            this.updateDisplay();
            if (this.state.time <= 0) {
                clearInterval(this.gameTimer);
                clearInterval(this.adsTimer);
                this.showDayResult();
            }
        }, 1000);

        this.adsTimer = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused) return;
            this.checkAdsEffect();
        }, 1000);
    }

    addIncomePerSecond() {
        const baseIncome = this.state.tourists * 0.3;

        let bonus = 1;
        bonus += (this.state.upgrades['worker-junior']?.owned || 0) * 0.5;
        bonus += (this.state.upgrades['worker-senior']?.owned || 0) * 1.2;

        const rawIncome = baseIncome * bonus;
        this.state.accumulatedIncome += rawIncome;

        const wholeDollars = Math.floor(this.state.accumulatedIncome);
        if (wholeDollars > 0) {
            this.state.money += wholeDollars;
            this.state.accumulatedIncome -= wholeDollars;
            this.showEarningPopup(wholeDollars);
        }
    }

    checkAdsEffect() {
        const flyers = this.state.upgrades['ads-flyers']?.owned || 0;
        const social = this.state.upgrades['ads-social']?.owned || 0;

        if (flyers > 0 && Math.random() < flyers * (1/6)) {
            this.state.tourists += 1;
            this.state.totalVisitors += 1;
            this.updateDisplay();
        }
        if (social > 0 && Math.random() < social * (1/12)) {
            this.state.tourists += 3;
            this.state.totalVisitors += 3;
            this.updateDisplay();
        }
    }

    buyUpgrade(type) {
        if (!this.state.isRunning || this.state.isPaused) return;
        const upgrade = this.state.upgrades[type];
        if (!upgrade || this.state.money < upgrade.cost) return;

        this.state.money -= upgrade.cost;
        upgrade.owned = (upgrade.owned || 0) + 1;
        upgrade.cost = Math.floor(upgrade.cost * 1.2);

        if (type === 'tourist-basic') {
            this.state.tourists += 1;
            this.state.totalVisitors += 1;
        } else if (type === 'tourist-group') {
            this.state.tourists += 3;
            this.state.totalVisitors += 3;
        }

        this.updateDisplay();
        this.api.hapticFeedback('light');
    }

    showEarningPopup(amount) {
        if (amount <= 0) return;
        const popup = document.createElement('div');
        popup.className = 'earning-popup';
        popup.textContent = `+$${amount}`;
        document.querySelector('.container').appendChild(popup);
        setTimeout(() => popup.parentNode?.removeChild(popup), 1200);
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        document.getElementById('pause-btn').textContent = this.state.isPaused ? '▶️' : '⏸️';
        this.api.setMainButtonText(this.state.isPaused ? 'Продолжить' : 'Пауза');
        this.api.hapticFeedback('medium');
    }

    showDayResult() {
        const earned = this.state.money - this.state.dayStartMoney;
        const quotaMet = this.state.money >= this.state.dailyQuota;
        if (quotaMet) this.state.completedDays++;

        if (quotaMet) {
            this.state.totalCompletedDays++;
            localStorage.setItem('poteryaevka_total_days', this.state.totalCompletedDays);
        }

        document.getElementById('day-number').textContent = this.state.currentDay;
        document.getElementById('day-earned').textContent = Math.floor(earned);
        document.getElementById('day-quota-target-val').textContent = this.state.dailyQuota;
        document.getElementById('day-visitors').textContent = this.state.totalVisitors;
        document.getElementById('day-workers').textContent = 
            (this.state.upgrades['worker-junior']?.owned || 0) + (this.state.upgrades['worker-senior']?.owned || 0);
        document.getElementById('day-ads').textContent = 
            (this.state.upgrades['ads-flyers']?.owned || 0) + (this.state.upgrades['ads-social']?.owned || 0);
        
        const eff = 1 +
            (this.state.upgrades['worker-junior']?.owned || 0) * 0.5 +
            (this.state.upgrades['worker-senior']?.owned || 0) * 1.2;
        document.getElementById('day-efficiency').textContent = Math.round(eff * 100);

        const quotaResult = document.getElementById('quota-result-text');
        quotaResult.textContent = quotaMet ? 'ВЫПОЛНЕНА ✅' : 'НЕ ВЫПОЛНЕНА ❌';
        quotaResult.className = `quota-result ${quotaMet ? 'success' : 'failed'}`;
        
        const nextBtn = document.getElementById('next-day-btn');
        const retryBtn = document.getElementById('retry-day-btn');
        if (quotaMet) {
            nextBtn.style.display = 'block';
            retryBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            retryBtn.style.display = 'block';

            // ❌ ОТПРАВКА ПРИ ПРОВАЛЕ ДНЯ (ТОЛЬКО В TELEGRAM)
            this.api.sendResult({
                type: "day_fail",
                day: this.state.currentDay,
                profit: Math.floor(this.state.money),
                completedDays: this.state.completedDays
            });
        }
        
        this.showScreen('day-result');
        this.api.hapticFeedback(quotaMet ? 'success' : 'error');
    }

    retryDay() {
        this.state.time = this.config.TIME_LIMIT;
        this.state.money = this.state.dayStartMoney;
        this.state.tourists = 0;
        this.state.totalVisitors = 0;
        this.state.accumulatedIncome = 0;
        this.state.isRunning = true;
        this.updateDisplay();
        this.showScreen('game');
        this.gameTimer = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused) return;
            this.state.time--;
            this.addIncomePerSecond();
            this.updateDisplay();
            if (this.state.time <= 0) {
                clearInterval(this.gameTimer);
                clearInterval(this.adsTimer);
                this.showDayResult();
            }
        }, 1000);
        this.adsTimer = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused) return;
            this.checkAdsEffect();
        }, 1000);
    }

    nextDay() {
        this.state.currentDay++;
        if (this.state.currentDay <= this.config.TOTAL_DAYS) {
            this.state.dayStartMoney = this.state.money;
            this.state.dailyQuota = this.config.DAILY_QUOTAS[this.state.currentDay - 1];
            this.state.time = this.config.TIME_LIMIT;
            this.state.isRunning = true;
            this.state.accumulatedIncome = 0;
            this.updateDisplay();
            this.showScreen('game');
            this.gameTimer = setInterval(() => {
                if (!this.state.isRunning || this.state.isPaused) return;
                this.state.time--;
                this.addIncomePerSecond();
                this.updateDisplay();
                if (this.state.time <= 0) {
                    clearInterval(this.gameTimer);
                    clearInterval(this.adsTimer);
                    this.showDayResult();
                }
            }, 1000);
            this.adsTimer = setInterval(() => {
                if (!this.state.isRunning || this.state.isPaused) return;
                this.checkAdsEffect();
            }, 1000);
        } else {
            this.endWeek();
        }
    }

    endWeek() {
        this.state.isRunning = false;
        clearInterval(this.gameTimer);
        clearInterval(this.adsTimer);

        const finalProfit = Math.floor(this.state.money);
        
        if (finalProfit > this.state.record) {
            this.state.record = finalProfit;
            localStorage.setItem('poteryaevka_week_record', this.state.record);
        }
        
        this.state.totalWeeks++;
        localStorage.setItem('poteryaevka_total_weeks', this.state.totalWeeks);

        document.getElementById('submit-score').textContent = finalProfit;
        document.getElementById('player-name').value = '';
        this.finalResult = {
            profit: finalProfit,
            completedDays: this.state.completedDays
        };
        this.showScreen('leaderboard');
    }

    submitLeaderboard() {
        const name = (document.getElementById('player-name').value || 'Аноним').trim() || 'Аноним';
        const profit = this.finalResult.profit;

        const best = JSON.parse(localStorage.getItem('poteryaevka_best_score')) || { name: '—', profit: 0 };
        if (profit > best.profit) {
            const newBest = { name, profit };
            localStorage.setItem('poteryaevka_best_score', JSON.stringify(newBest));
        }

        // ✅ ОТПРАВКА ПРИ УСПЕХЕ (ТОЛЬКО В TELEGRAM)
        this.api.sendResult({ 
            type: "week_success",
            profit: profit,
            completedDays: this.finalResult.completedDays,
            name: name
        });

        this.updateOverviewStats();
        this.showScreen('main-menu');
    }

    skipLeaderboard() {
        this.api.sendResult({ 
            type: "week_success",
            profit: this.finalResult.profit,
            completedDays: this.finalResult.completedDays,
            name: "Аноним"
        });
        this.showScreen('main-menu');
    }

    updateOverviewStats() {
        document.getElementById('overview-weeks').textContent = this.state.totalWeeks;
        document.getElementById('overview-days').textContent = this.state.totalCompletedDays;

        const best = JSON.parse(localStorage.getItem('poteryaevka_best_score')) || { name: '—', profit: 0 };
        document.getElementById('overview-record').textContent = `${best.profit} (${best.name})`;
    }

    updateDisplay() {
        document.getElementById('current-day').textContent = this.state.currentDay;
        document.getElementById('timer').textContent = this.state.time;
        document.getElementById('money').textContent = Math.floor(this.state.money);
        document.getElementById('quota').textContent = this.state.dailyQuota;
        document.getElementById('total-visitors').textContent = this.state.totalVisitors;
        document.getElementById('total-workers').textContent = 
            (this.state.upgrades['worker-junior']?.owned || 0) + (this.state.upgrades['worker-senior']?.owned || 0);
        document.getElementById('total-ads').textContent = 
            (this.state.upgrades['ads-flyers']?.owned || 0) + (this.state.upgrades['ads-social']?.owned || 0);
        
        const progress = Math.min(this.state.money / this.state.dailyQuota, 1);
        document.getElementById('progress-fill').style.width = `${progress * 100}%`;
        document.getElementById('quota-progress').textContent = `${Math.floor(this.state.money)}/${this.state.dailyQuota}`;
        
        document.querySelectorAll('.upgrade-item').forEach(item => {
            const type = item.dataset.type;
            const upgrade = this.state.upgrades[type];
            if (upgrade) {
                item.querySelector('.upgrade-cost span').textContent = upgrade.cost;
                item.querySelector('.buy-btn').disabled = this.state.money < upgrade.cost;
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`${screenName}-screen`);
        if (target) target.classList.add('active');

        if (screenName === 'game') {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
    }
}

window.addEventListener('load', () => new WeekBusinessGame());