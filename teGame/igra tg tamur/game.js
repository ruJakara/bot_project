class TimurClicker {
    constructor() {
        this.state = 'menu';
        this.coins = 0;
        this.clickPower = GAME_CONFIG.clickPower;
        this.itemsOwned = 0;
        this.rebirthMultiplier = 1;
        this.ownedCounts = new Array(100).fill(0);
        this.init();
    }

    init() {
        this.bindEvents();
        this.showScreen('menu');
        this.loadGame();
    }

    bindEvents() {
        document.getElementById('startBtn').onclick = () => this.startGame();
        document.getElementById('clickArea').onclick = (e) => this.click(e);
        document.getElementById('shopBtn').onclick = () => this.toggleShop();
        document.getElementById('shopClose').onclick = () => this.toggleShop();
        document.getElementById('rebirthBtn').onclick = () => this.rebirth();
        document.getElementById('restartBtn').onclick = () => this.restart();
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'game') {
                e.preventDefault();
                this.click();
            }
        });
    }

    renderShop() {
        const container = document.getElementById('shopItems');
        container.innerHTML = '';

        // Показываем топ-20 лучших предметов
        const bestItems = GAME_CONFIG.shopItems
            .map((item, i) => ({...item, index: i}))
            .map(item => ({
                ...item,
                cost: this.getItemCost(item.index),
                value: item.multiplier / item.cost
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20);

        bestItems.forEach(item => {
            const affordable = this.coins >= item.cost;
            const div = document.createElement('div');
            div.className = `shop-item ${item.owned > 0 ? 'owned' : ''}`;
            div.innerHTML = `
                <div class="emoji">${item.emoji}</div>
                <div class="name">${item.name}</div>
                <div>💰 ${this.formatNumber(item.cost)}</div>
                <div>+${this.formatNumber(item.multiplier)}/клик</div>
                <button ${this.itemsOwned >= 100 || !affordable ? 'disabled' : ''}>
                    ${this.itemsOwned >= 100 ? '🎒 ЛИМИТ' : affordable ? '💰 КУПИТЬ' : '❌ МАЛО'}
                </button>
            `;
            div.onclick = (e) => {
                if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
                    this.buyItem(item.index);
                }
            };
            container.appendChild(div);
        });
    }

    startGame() {
        this.state = 'game';
        this.coins = 0;
        this.clickPower = GAME_CONFIG.clickPower * this.rebirthMultiplier;
        this.itemsOwned = 0;
        this.ownedCounts.fill(0);
        GAME_CONFIG.shopItems.forEach(item => item.owned = 0);
        this.showScreen('game');
        this.updateUI();
    }

    click(e) {
        if (this.state !== 'game') return;
        if (e) e.preventDefault();

        const coin = document.querySelector('.coin');
        coin.style.transform = 'scale(1.4) rotate(360deg)';
        setTimeout(() => coin.style.transform = '', 200);

        this.coins += Math.floor(this.clickPower);
        this.updateUI();
        this.saveGame();
    }

    buyItem(index) {
        if (this.itemsOwned >= 100) return;
        const cost = this.getItemCost(index);
        if (this.coins >= cost) {
            this.coins -= cost;
            GAME_CONFIG.shopItems[index].owned++;
            this.ownedCounts[index]++;
            this.itemsOwned++;
            this.clickPower += GAME_CONFIG.shopItems[index].multiplier * this.rebirthMultiplier;
            this.updateUI();
            this.renderShop();
            this.saveGame();
        }
    }

    getItemCost(index) {
        const item = GAME_CONFIG.shopItems[index];
        return Math.floor(item.baseCost * Math.pow(1.15, this.ownedCounts[index]));
    }

    toggleShop() {
        document.getElementById('shop').classList.toggle('hidden');
        if (!document.getElementById('shop').classList.contains('hidden')) {
            this.renderShop();
        }
    }

    rebirth() {
        if (this.coins >= GAME_CONFIG.rebirthThreshold) {
            this.rebirthMultiplier *= GAME_CONFIG.rebirthMultiplier;
            document.getElementById('finalCoins').textContent = this.formatNumber(this.coins);
            sendToBot(this.coins, '🔄 ПЕРЕРОЖДЕНИЕ');
            this.state = 'result';
            this.showScreen('result');
        }
    }

    restart() {
        this.showScreen('menu');
        this.state = 'menu';
    }

    updateUI() {
        document.getElementById('coins').textContent = this.formatNumber(this.coins);
        document.getElementById('clickPower').textContent = this.formatNumber(this.clickPower);
        document.getElementById('itemsOwned').textContent = this.itemsOwned;
        
        const btn = document.getElementById('rebirthBtn');
        const canRebirth = this.coins >= GAME_CONFIG.rebirthThreshold;
        btn.style.display = canRebirth ? 'block' : 'none';
    }

    formatNumber(num) {
        if (num >= 1e12) return (num/1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num/1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num/1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num/1e3).toFixed(1) + 'K';
        return Math.floor(num).toLocaleString();
    }

    showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screen).classList.add('active');
        document.getElementById('shop').classList.add('hidden');
    }

    saveGame() {
        localStorage.setItem('timurClicker', JSON.stringify({
            rebirthMultiplier: this.rebirthMultiplier,
            ownedCounts: this.ownedCounts.slice(),
            itemsOwned: this.itemsOwned
        }));
    }

    loadGame() {
        try {
            const data = JSON.parse(localStorage.getItem('timurClicker'));
            if (data) {
                this.rebirthMultiplier = data.rebirthMultiplier || 1;
                this.ownedCounts = data.ownedCounts || new Array(100).fill(0);
                this.itemsOwned = data.itemsOwned || 0;
                data.ownedCounts?.forEach((count, i) => {
                    if (count > 0) {
                        GAME_CONFIG.shopItems[i].owned = count;
                        this.clickPower += count * GAME_CONFIG.shopItems[i].multiplier * this.rebirthMultiplier;
                    }
                });
            }
        } catch (e) {}
    }
}

const game = new TimurClicker();
