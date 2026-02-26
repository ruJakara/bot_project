// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
let canvas = null;
let ctx = null;

let gameState = {
    screen: 'main',
    difficulty: 'easy',
    coins: 0,
    upgrades: {
        jump: 0,
        life: 0,
        shield: 0,
        magnet: 0,
        slow: 0,
        doubleJump: 0
    },
    settings: {
        sound: true,
        particles: true,
        quality: 'high',
        showFPS: false
    }
};

const difficultySettings = {
    easy:   { lavaSpeed: 0.3, coinMultiplier: 1.0, gapY: 80, maxDX: 130, spikeBallCount: 0, platformDensity: 1.0 },
    normal: { lavaSpeed: 0.5, coinMultiplier: 1.5, gapY: 100, maxDX: 160, spikeBallCount: 0, platformDensity: 0.9 },
    hard:   { lavaSpeed: 0.7, coinMultiplier: 2.0, gapY: 130, maxDX: 200, spikeBallCount: 3, platformDensity: 0.75 },
    extreme:{ lavaSpeed: 1.0, coinMultiplier: 3.0, gapY: 160, maxDX: 260, spikeBallCount: 6, platformDensity: 0.5 }
};

const upgradeCosts = {
    jump: [50, 75, 100, 150, 200],
    life: [100, 150, 200],
    shield: [150, 200, 250],
    magnet: [75, 100, 125, 150, 200],
    slow: [120, 180, 250],
    doubleJump: [200]
};

let game = {
    running: false,
    paused: false,
    score: 0,
    coins: 0,
    lives: 3,
    maxLives: 3,
    player: null,
    platforms: [],
    lava: null,
    particles: [],
    coinObjects: [],
    spikeBalls: [],
    frameCount: 0,
    fps: 60,
    fpsUpdateTime: 0,
    screenShake: { x: 0, y: 0, intensity: 0 },
    respawnPlatform: null,
    isRespawning: false,
    lastPlatform: null,
    camera: { y: 0 }
};

const input = {
    left: false,
    right: false
};

// ====================== ЗАГРУЗКА / СОХРАНЕНИЕ ======================
function loadGameData() {
    const saved = localStorage.getItem('lavaJumperSave');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.coins = data.coins || 0;
        gameState.upgrades = data.upgrades || gameState.upgrades;
        gameState.difficulty = data.difficulty || 'easy';
        gameState.settings = data.settings || gameState.settings;
    }
    updateCoinsDisplay();
}

function saveGameData() {
    const data = {
        coins: gameState.coins,
        upgrades: gameState.upgrades,
        difficulty: gameState.difficulty,
        settings: gameState.settings
    };
    localStorage.setItem('lavaJumperSave', JSON.stringify(data));
}

// ====================== ЧАСТИЦЫ ИСКР ФОНА ======================
function createSparks() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    setInterval(() => {
        if (gameState.screen !== 'game' && gameState.settings.particles) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.style.left = Math.random() * 100 + '%';
            spark.style.bottom = '0';
            spark.style.setProperty('--drift', (Math.random() - 0.5) * 200 + 'px');
            spark.style.animationDuration = (2 + Math.random() * 2) + 's';
            particlesContainer.appendChild(spark);

            setTimeout(() => spark.remove(), 4000);
        }
    }, 300);
}

// ====================== МЕНЮ ======================
function showMainMenu() {
    hideAllMenus();
    document.getElementById('mainMenu').classList.add('active');
    gameState.screen = 'main';
}

function showPlayMenu() {
    hideAllMenus();
    document.getElementById('playMenu').classList.add('active');
    gameState.screen = 'play';
}

function showDifficulty() {
    hideAllMenus();
    document.getElementById('difficultyMenu').classList.add('active');
    updateDifficultyDisplay();
    gameState.screen = 'difficulty';
}

function showUpgrades() {
    hideAllMenus();
    document.getElementById('upgradesMenu').classList.add('active');
    updateUpgradesDisplay();
    gameState.screen = 'upgrades';
}

function showSettings() {
    hideAllMenus();
    document.getElementById('settingsMenu').classList.add('active');
    updateSettingsDisplay();
    gameState.screen = 'settings';
}

function hideAllMenus() {
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
    });
}

function exitGame() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        window.close();
    }
}

// ====================== МОНЕТЫ / СЛОЖНОСТЬ / УЛУЧШЕНИЯ ======================
function updateCoinsDisplay() {
    const totalCoins = document.getElementById('totalCoins');
    if (totalCoins) totalCoins.textContent = gameState.coins;

    const upgradeCoins = document.getElementById('upgradeCoins');
    if (upgradeCoins) upgradeCoins.textContent = gameState.coins;
}

function setDifficulty(level) {
    gameState.difficulty = level;
    updateDifficultyDisplay();
    saveGameData();
}

function updateDifficultyDisplay() {
    const diffNames = { easy: 'ЛЕГКО', normal: 'НОРМАЛЬНО', hard: 'СЛОЖНО', extreme: 'ЭКСТРИМ' };
    document.getElementById('currentDifficulty').textContent = diffNames[gameState.difficulty];
    document.getElementById('coinMultiplier').textContent = 'x' + difficultySettings[gameState.difficulty].coinMultiplier;
}

function buyUpgrade(type) {
    const level = gameState.upgrades[type];
    const maxLevels = upgradeCosts[type].length;

    if (level >= maxLevels) {
        alert('Максимальный уровень достигнут!');
        return;
    }

    const cost = upgradeCosts[type][level];

    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.upgrades[type]++;
        updateCoinsDisplay();
        updateUpgradesDisplay();
        saveGameData();
    } else {
        alert('Недостаточно монет!');
    }
}

function updateUpgradesDisplay() {
    Object.keys(gameState.upgrades).forEach(type => {
        const levelSpan = document.getElementById(type + 'Level');
        if (levelSpan) levelSpan.textContent = gameState.upgrades[type];
    });

    const types = ['jump', 'life', 'shield', 'magnet', 'slow', 'doubleJump'];
    document.querySelectorAll('.upgrade-btn').forEach((btn, index) => {
        const type = types[index];
        if (!type) return;

        const level = gameState.upgrades[type];
        const maxLevel = upgradeCosts[type].length;

        if (level >= maxLevel) {
            btn.textContent = 'МАКС';
            btn.disabled = true;
        } else {
            const cost = upgradeCosts[type][level];
            btn.textContent = `Купить (${cost}💰)`;
            btn.disabled = gameState.coins < cost;
        }
    });
}

// ====================== НАСТРОЙКИ ======================
function toggleSound() {
    gameState.settings.sound = !gameState.settings.sound;
    updateSettingsDisplay();
    saveGameData();
}

function toggleParticles() {
    gameState.settings.particles = !gameState.settings.particles;
    updateSettingsDisplay();
    saveGameData();
}

function changeQuality() {
    gameState.settings.quality = document.getElementById('qualitySelect').value;
    saveGameData();
}

function toggleFPS() {
    gameState.settings.showFPS = !gameState.settings.showFPS;
    updateSettingsDisplay();
    saveGameData();

    const fpsCounter = document.getElementById('fpsCounter');
    if (fpsCounter) {
        fpsCounter.style.display = gameState.settings.showFPS ? 'block' : 'none';
    }
}

function updateSettingsDisplay() {
    document.getElementById('soundToggle').textContent = gameState.settings.sound ? 'ВКЛ' : 'ВЫКЛ';
    document.getElementById('soundToggle').classList.toggle('off', !gameState.settings.sound);

    document.getElementById('particlesToggle').textContent = gameState.settings.particles ? 'ВКЛ' : 'ВЫКЛ';
    document.getElementById('particlesToggle').classList.toggle('off', !gameState.settings.particles);

    document.getElementById('fpsToggle').textContent = gameState.settings.showFPS ? 'ВКЛ' : 'ВЫКЛ';
    document.getElementById('fpsToggle').classList.toggle('off', !gameState.settings.showFPS);

    document.getElementById('qualitySelect').value = gameState.settings.quality;
}

// ====================== СТАРТ / ИНИТ ИГРЫ ======================
function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    hideAllMenus();
    document.getElementById('gameScreen').classList.add('active');
    gameState.screen = 'game';

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    initGame();
    game.running = true;
    game.paused = false;

    game.fpsUpdateTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function initGame() {
    const jumpBonus = 1 + (gameState.upgrades.jump * 0.2);
    const lives = 3 + gameState.upgrades.life;

    game.score = 0;
    game.coins = 0;
    game.lives = lives;
    game.maxLives = lives;
    game.frameCount = 0;
    game.particles = [];
    game.coinObjects = [];
    game.spikeBalls = [];
    game.screenShake = { x: 0, y: 0, intensity: 0 };
    game.respawnPlatform = null;
    game.isRespawning = false;
    game.camera = { y: 0 };

    game.player = {
        x: canvas.width / 2,
        y: canvas.height - 200,
        radius: 15,
        velocityY: 0,
        velocityX: 0,
        jumpPower: -12 * jumpBonus,
        gravity: 0.5,
        onGround: false,
        canDoubleJump: gameState.upgrades.doubleJump > 0,
        hasDoubleJumped: false,
        shieldActive: false,
        shieldUsed: false,
        shieldTime: 0,
        slowTime: gameState.upgrades.slow * 10 * 60,
        scaleX: 1,
        scaleY: 1,
        targetScaleX: 1,
        targetScaleY: 1
    };

    game.platforms = [];
    const startPlatform = {
        x: canvas.width / 2 - 60,
        y: canvas.height - 150,
        width: 120,
        height: 15
    };
    game.platforms.push(startPlatform);
    game.lastPlatform = startPlatform;

    for (let i = 1; i < 25; i++) {
        createPlatform();
    }

    game.lava = {
        y: canvas.height + 100,
        speed: difficultySettings[gameState.difficulty].lavaSpeed
    };

    const settings = difficultySettings[gameState.difficulty];
    for (let i = 0; i < settings.spikeBallCount; i++) {
        createSpikeBall();
    }

    updateGameUI();
}

// ====================== ГЕНЕРАЦИЯ ПЛАТФОРМ ======================
function createPlatform() {
    const settings = difficultySettings[gameState.difficulty];

    if (Math.random() > settings.platformDensity) {
        game.lastPlatform = {
            x: game.lastPlatform.x,
            y: game.lastPlatform.y - settings.gapY,
            width: 120,
            height: 15
        };
        return;
    }

    let base = game.lastPlatform;
    if (!base) {
        base = {
            x: canvas.width / 2 - 60,
            y: canvas.height - 150,
            width: 120,
            height: 15
        };
    }

    const gapY = settings.gapY;
    const maxDX = settings.maxDX;
    const newY = base.y - gapY;

    const minX = Math.max(40, base.x - maxDX);
    const maxX = Math.min(canvas.width - 160, base.x + maxDX);
    const newX = minX + Math.random() * Math.max(40, maxX - minX);

    const platform = {
        x: newX,
        y: newY,
        width: 90 + Math.random() * 40,
        height: 15
    };

    if (Math.random() < 0.5) {
        game.coinObjects.push({
            x: platform.x + platform.width / 2,
            y: platform.y - 30,
            radius: 10,
            collected: false
        });
    }

    game.platforms.push(platform);
    game.lastPlatform = platform;
}

// ====================== ОСТРЫЕ ШАРИКИ ======================
function createSpikeBall() {
    const spikeBall = {
        x: Math.random() * (canvas.width - 100) + 50,
        y: game.camera.y - Math.random() * 500 - 200,
        radius: 12,
        velocityX: (Math.random() - 0.5) * 3,
        velocityY: Math.random() * 2 + 1,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        rotation: 0
    };
    game.spikeBalls.push(spikeBall);
}

// ====================== ГЛАВНЫЙ ЦИКЛ ======================
function gameLoop(timestamp) {
    if (!game.running) return;

    game.frameCount++;
    if (timestamp - game.fpsUpdateTime >= 1000) {
        game.fps = game.frameCount;
        game.frameCount = 0;
        game.fpsUpdateTime = timestamp;

        if (gameState.settings.showFPS) {
            const fpsSpan = document.getElementById('fps');
            if (fpsSpan) fpsSpan.textContent = game.fps;
        }
    }

    if (!game.paused) {
        updateGame();
        drawGame();
    }

    requestAnimationFrame(gameLoop);
}

// ====================== ОБНОВЛЕНИЕ ИГРЫ ======================
function updateGame() {
    const player = game.player;
    const settings = difficultySettings[gameState.difficulty];
    const prevY = player.y;

    // Управление
    if (input.left) {
        player.velocityX = Math.max(player.velocityX - 0.8, -6);
    } else if (input.right) {
        player.velocityX = Math.min(player.velocityX + 0.8, 6);
    } else {
        player.velocityX *= 0.85;
    }

    player.velocityY += player.gravity;
    player.y += player.velocityY;
    player.x += player.velocityX;

    if (player.x < player.radius) player.x = player.radius;
    if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;

    // Squash & Stretch по направлению движения
    const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);

    if (player.onGround) {
        player.targetScaleX = 1.1;
        player.targetScaleY = 0.9;
    } else if (speed > 1) {
        const angle = Math.atan2(player.velocityY, player.velocityX);
        const stretchAmount = Math.min(speed / 10, 0.4);

        const absAngle = Math.abs(angle);
        const isVertical = absAngle > Math.PI / 4 && absAngle < 3 * Math.PI / 4;

        if (isVertical) {
            if (player.velocityY < 0) {
                player.targetScaleX = 1 - stretchAmount;
                player.targetScaleY = 1 + stretchAmount;
            } else {
                player.targetScaleX = 1 - stretchAmount * 0.8;
                player.targetScaleY = 1 + stretchAmount * 0.8;
            }
        } else {
            player.targetScaleX = 1 + stretchAmount;
            player.targetScaleY = 1 - stretchAmount;
        }
    } else {
        player.targetScaleX = 1;
        player.targetScaleY = 1;
    }

    player.scaleX += (player.targetScaleX - player.scaleX) * 0.2;
    player.scaleY += (player.targetScaleY - player.scaleY) * 0.2;

    // Коллизия с платформами
    player.onGround = false;
    for (const platform of game.platforms) {
        const wasAbove = prevY + player.radius <= platform.y;
        const nowBelowTop = player.y + player.radius >= platform.y;
        const withinHorizontal =
            player.x > platform.x - player.radius &&
            player.x < platform.x + platform.width + player.radius;

        if (player.velocityY >= 0 && wasAbove && nowBelowTop && withinHorizontal) {
            player.y = platform.y - player.radius;
            player.velocityY = 0;
            player.onGround = true;
            player.hasDoubleJumped = false;
            break;
        }
    }

    // Коллизия с платформой возрождения
    if (game.respawnPlatform && !game.isRespawning) {
        const plat = game.respawnPlatform;
        const wasAbove = prevY + player.radius <= plat.y;
        const nowBelowTop = player.y + player.radius >= plat.y;
        const withinHorizontal =
            player.x > plat.x - player.radius &&
            player.x < plat.x + plat.width + player.radius;

        if (player.velocityY >= 0 && wasAbove && nowBelowTop && withinHorizontal) {
            player.y = plat.y - player.radius;
            player.velocityY = 0;
            player.onGround = true;
            player.hasDoubleJumped = false;
        }
    }

    if (game.respawnPlatform && player.y < game.respawnPlatform.y - 100) {
        game.respawnPlatform = null;
    }

    // Камера следует за игроком ТОЛЬКО если он поднимается выше середины экрана
    const playerScreenY = player.y - game.camera.y;
    if (playerScreenY < canvas.height / 3) {
        const targetCameraY = player.y - canvas.height / 3;
        game.camera.y += (targetCameraY - game.camera.y) * 0.1;
    }

    // Обновление платформ
    for (let i = game.platforms.length - 1; i >= 0; i--) {
        const p = game.platforms[i];
        const screenY = p.y - game.camera.y;

        if (screenY > canvas.height + 100) {
            game.platforms.splice(i, 1);
            game.score += 10;
        }
    }

    while (game.platforms.length < 25) {
        createPlatform();
    }

    // Обновление острых шариков
    const maxSpikeBalls = settings.spikeBallCount;
    for (let i = game.spikeBalls.length - 1; i >= 0; i--) {
        const ball = game.spikeBalls[i];
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        ball.rotation += ball.rotationSpeed;

        if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
            ball.velocityX *= -1;
        }

        const screenY = ball.y - game.camera.y;
        if (screenY > canvas.height + 100) {
            game.spikeBalls.splice(i, 1);
        }

        if (!player.shieldActive) {
            const dist = Math.hypot(player.x - ball.x, player.y - ball.y);
            if (dist < player.radius + ball.radius) {
                playerDeath();
            }
        }
    }

    while (game.spikeBalls.length < maxSpikeBalls) {
        createSpikeBall();
    }

    // Монеты с ускоряющимся магнитом
    const magnetRange = 50 + (gameState.upgrades.magnet * 20);
    for (let i = game.coinObjects.length - 1; i >= 0; i--) {
        const coin = game.coinObjects[i];

        const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
        if (dist < magnetRange) {
            const angle = Math.atan2(player.y - coin.y, player.x - coin.x);
            // Ускорение увеличивается при приближении к игроку
            const distRatio = 1 - (dist / magnetRange);
            const magnetSpeed = 2 + distRatio * 6; // От 2 до 8 пикселей
            coin.x += Math.cos(angle) * magnetSpeed;
            coin.y += Math.sin(angle) * magnetSpeed;
        }

        if (dist < player.radius + coin.radius && !coin.collected) {
            coin.collected = true;
            game.coins++;
            createParticles(coin.x, coin.y, '#ffff00', 10);
        }

        const screenY = coin.y - game.camera.y;
        if (screenY > canvas.height + 100 || coin.collected) {
            game.coinObjects.splice(i, 1);
        }
    }

    // Щит
    if (!player.shieldUsed && !player.shieldActive && gameState.upgrades.shield > 0) {
        player.shieldActive = true;
        player.shieldTime = gameState.upgrades.shield * 5 * 60;
        player.shieldUsed = true;
    }

    if (player.shieldActive && player.shieldTime > 0) {
        player.shieldTime--;
        if (player.shieldTime <= 0) {
            player.shieldActive = false;
        }
    }

    // Лава поднимается в мировых координатах
    let lavaSpeed = settings.lavaSpeed;
    if (player.slowTime > 0) {
        player.slowTime--;
        lavaSpeed *= 0.5;
    }
    game.lava.y -= lavaSpeed;

    // Проверка столкновения с лавой
    if (player.y + player.radius > game.lava.y) {
        if (player.shieldActive) {
            player.y = game.lava.y - player.radius - 5;
            player.velocityY = player.jumpPower * 0.7;
        } else {
            playerDeath();
        }
    }

    if (player.y > game.lava.y + 100) {
        playerDeath();
    }

    // Частицы
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;

        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }

    // Тряска экрана
    if (game.screenShake.intensity > 0) {
        game.screenShake.intensity *= 0.9;
        const angle = Math.random() * Math.PI * 2;
        game.screenShake.x = Math.cos(angle) * game.screenShake.intensity;
        game.screenShake.y = Math.sin(angle) * game.screenShake.intensity;

        if (game.screenShake.intensity < 0.5) {
            game.screenShake.intensity = 0;
            game.screenShake.x = 0;
            game.screenShake.y = 0;
        }
    }

    updateGameUI();
}

// ====================== СМЕРТЬ / РЕСПАВН ======================
function playerDeath() {
    if (game.isRespawning) return;

    game.lives--;
    createExplosion(game.player.x, game.player.y);
    game.screenShake.intensity = 20;

    if (game.lives <= 0) {
        setTimeout(() => gameOver(), 500);
    } else {
        game.isRespawning = true;
        setTimeout(() => respawnPlayer(), 800);
    }
}

function respawnPlayer() {
    const player = game.player;

    player.x = canvas.width / 2;
    player.y = game.camera.y - 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.scaleX = 1;
    player.scaleY = 1;

    player.shieldActive = false;
    player.shieldUsed = false;
    player.shieldTime = 0;

    game.respawnPlatform = {
        x: player.x - 60,
        y: player.y + 80,
        width: 120,
        height: 15
    };

    game.isRespawning = false;
    createParticles(player.x, player.y, '#ffffff', 20);
}

// ====================== ЧАСТИЦЫ ВЗРЫВА / ЭФФЕКТЫ ======================
function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffff00'];

        game.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 4,
            isExplosion: true
        });
    }
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 30,
            maxLife: 30,
            color: color,
            size: 3,
            isExplosion: false
        });
    }
}

// ====================== РИСОВАНИЕ ======================
function drawGame() {
    ctx.save();
    ctx.translate(game.screenShake.x, game.screenShake.y);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a0000');
    gradient.addColorStop(0.7, '#000000');
    gradient.addColorStop(1, '#1a0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(-game.screenShake.x, -game.screenShake.y, canvas.width, canvas.height);

    // Стены вулкана
    ctx.fillStyle = '#330000';
    for (let i = -2; i < 12; i++) {
        const offset = Math.sin(Date.now() / 1000 + i) * 20;
        const worldY = game.camera.y + i * 100;
        const screenY = worldY - game.camera.y;
        ctx.fillRect(-50 + offset, screenY, 80, 100);
        ctx.fillRect(canvas.width - 30 + offset, screenY, 80, 100);
    }

    // Лава (в мировых координатах, но держится на экране)
    const lavaScreenY = game.lava.y - game.camera.y;
    const lavaGradient = ctx.createLinearGradient(0, lavaScreenY - 100, 0, lavaScreenY + 100);
    lavaGradient.addColorStop(0, '#ff0000');
    lavaGradient.addColorStop(0.5, '#ff6600');
    lavaGradient.addColorStop(1, '#ffaa00');
    ctx.fillStyle = lavaGradient;

    ctx.beginPath();
    ctx.moveTo(0, lavaScreenY);
    for (let x = 0; x <= canvas.width; x += 20) {
        const wave = Math.sin(x / 30 + Date.now() / 200) * 10;
        ctx.lineTo(x, lavaScreenY + wave);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff6600';
    ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
    ctx.fillRect(0, lavaScreenY - 50, canvas.width, 50);
    ctx.shadowBlur = 0;

    // Платформы
    for (const platform of game.platforms) {
        const screenY = platform.y - game.camera.y;
        if (screenY > -50 && screenY < canvas.height + 50) {
            drawPlatform(platform.x, screenY, platform.width, platform.height);
        }
    }

    // Платформа возрождения
    if (game.respawnPlatform) {
        const screenY = game.respawnPlatform.y - game.camera.y;
        ctx.save();
        ctx.globalAlpha = 0.8;
        const respawnGrad = ctx.createLinearGradient(
            game.respawnPlatform.x,
            screenY,
            game.respawnPlatform.x,
            screenY + game.respawnPlatform.height
        );
        respawnGrad.addColorStop(0, '#00ffff');
        respawnGrad.addColorStop(1, '#0088ff');
        ctx.fillStyle = respawnGrad;
        ctx.fillRect(game.respawnPlatform.x, screenY, game.respawnPlatform.width, game.respawnPlatform.height);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(game.respawnPlatform.x, screenY, game.respawnPlatform.width, game.respawnPlatform.height);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Монеты
    for (const coin of game.coinObjects) {
        if (!coin.collected) {
            const screenY = coin.y - game.camera.y;
            if (screenY > -50 && screenY < canvas.height + 50) {
                const rotation = Date.now() / 200;
                ctx.save();
                ctx.translate(coin.x, screenY);
                ctx.rotate(rotation);

                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffaa00';
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.restore();
            }
        }
    }

    // Острые шарики
    for (const ball of game.spikeBalls) {
        const screenY = ball.y - game.camera.y;
        if (screenY > -50 && screenY < canvas.height + 50) {
            ctx.save();
            ctx.translate(ball.x, screenY);
            ctx.rotate(ball.rotation);

            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#999';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * ball.radius, Math.sin(angle) * ball.radius);
                ctx.lineTo(Math.cos(angle) * (ball.radius + 6), Math.sin(angle) * (ball.radius + 6));
                ctx.closePath();
                ctx.fill();
            }

            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }

    // Игрок
    if (!game.isRespawning) {
        const player = game.player;
        const playerScreenY = player.y - game.camera.y;

        if (player.shieldActive && player.shieldTime > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(player.x, playerScreenY, player.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.save();
        ctx.translate(player.x, playerScreenY);
        ctx.scale(player.scaleX, player.scaleY);

        const ballGradient = ctx.createRadialGradient(-5, -5, 2, 0, 0, player.radius);
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.3, '#ffff00');
        ballGradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    // Частицы
    for (const p of game.particles) {
        const screenY = p.y - game.camera.y;
        if (p.isExplosion) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, screenY, p.size, p.size);
            ctx.globalAlpha = 1;
        }
    }

    ctx.restore();
}

function drawPlatform(x, y, width, height) {
    const platGradient = ctx.createLinearGradient(x, y, x, y + height);
    platGradient.addColorStop(0, '#666');
    platGradient.addColorStop(1, '#333');
    ctx.fillStyle = platGradient;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

// ====================== UI / ПАУЗА / GAME OVER ======================
function updateGameUI() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('gameCoins').textContent = game.coins;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, game.lives));
}

function pauseGame() {
    game.paused = true;
    document.getElementById('pauseMenu').classList.add('active');
}

function resumeGame() {
    game.paused = false;
    document.getElementById('pauseMenu').classList.remove('active');
}

function restartGame() {
    document.getElementById('gameOverMenu').classList.remove('active');
    initGame();
    game.running = true;
    game.paused = false;
    game.fpsUpdateTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function quitToMenu() {
    game.running = false;
    game.paused = false;
    input.left = false;
    input.right = false;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('pauseMenu').classList.remove('active');
    document.getElementById('gameOverMenu').classList.remove('active');
    showMainMenu();
}

function gameOver() {
    game.running = false;

    const earnedCoins = Math.floor(game.coins * difficultySettings[gameState.difficulty].coinMultiplier);
    gameState.coins += earnedCoins;

    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('earnedCoins').textContent = earnedCoins;
    document.getElementById('gameOverMenu').classList.add('active');

    updateCoinsDisplay();
    saveGameData();
}

// ====================== УПРАВЛЕНИЕ ======================
document.addEventListener('keydown', (e) => {
    if (!game.running || game.paused || game.isRespawning) return;

    const player = game.player;

    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (player.onGround) {
            player.velocityY = player.jumpPower;
            createParticles(player.x, player.y + player.radius, '#ffffff', 5);
        } else if (player.canDoubleJump && !player.hasDoubleJumped) {
            player.velocityY = player.jumpPower * 0.8;
            player.hasDoubleJumped = true;
            createParticles(player.x, player.y, '#ffffff', 8);
        }
    }

    if (e.code === 'ArrowLeft') input.left = true;
    if (e.code === 'ArrowRight') input.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'ArrowRight') input.right = false;
});

document.addEventListener('touchstart', (e) => {
    if (!game.running || game.paused || !canvas || game.isRespawning) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    const player = game.player;

    if (player.onGround) {
        player.velocityY = player.jumpPower;
        createParticles(player.x, player.y + player.radius, '#ffffff', 5);
    } else if (player.canDoubleJump && !player.hasDoubleJumped) {
        player.velocityY = player.jumpPower * 0.8;
        player.hasDoubleJumped = true;
        createParticles(player.x, player.y, '#ffffff', 8);
    }

    if (touchX < canvas.width / 2) {
        input.left = true;
        input.right = false;
    } else {
        input.right = true;
        input.left = false;
    }
});

document.addEventListener('touchend', () => {
    input.left = false;
    input.right = false;
});

// ====================== ИНИЦИАЛИЗАЦИЯ ======================
window.addEventListener('load', () => {
    loadGameData();
    createSparks();
    showMainMenu();

    window.addEventListener('resize', () => {
        if (game.running && canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
});