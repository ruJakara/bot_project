// DOM элементы
const menuScreen = document.getElementById('menu');
const resultScreen = document.getElementById('result');
const canvas = document.getElementById('gameCanvas');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');

const ctx = canvas.getContext('2d');

let gameState = 'menu';
let score = 0;
let playerHealth = 100;

// Таймер восстановления
let healInterval = null;

const SAFE_HOUSE = {
  x: canvas.width - 120,
  y: canvas.height - 180,
  width: 100,
  height: 140
};

const WEAPONS = {
  PISTOL: { name: "Пистолет", id: 1, damage: 10, maxAmmo: 14, reloadTime: 4000 },
  SHOTGUN: { name: "Дробовик", id: 2, damage: 8, maxAmmo: 8, reloadTime: 7000 },
  LASER: { name: "Лазер", id: 3, damage: 30, maxAmmo: 6, reloadTime: 9000 },
  KNIFE: { name: "Нож", id: 4 },
  ICE: { name: "Лёд", id: 5 }
};

let currentWeapon = WEAPONS.PISTOL;

let ammo = {
  [WEAPONS.PISTOL.id]: WEAPONS.PISTOL.maxAmmo,
  [WEAPONS.SHOTGUN.id]: WEAPONS.SHOTGUN.maxAmmo,
  [WEAPONS.LASER.id]: WEAPONS.LASER.maxAmmo
};

let isReloading = {
  [WEAPONS.PISTOL.id]: false,
  [WEAPONS.SHOTGUN.id]: false,
  [WEAPONS.LASER.id]: false
};

const ICE_MAX_CHARGES = 3;
let iceCharges = ICE_MAX_CHARGES;
let isIceOnCooldown = false;

const iconSize = 42;
const iconPadding = 8;
const iconY = canvas.height - iconSize - iconPadding;

const weaponIcons = [
  { weapon: WEAPONS.PISTOL, x: iconPadding },
  { weapon: WEAPONS.SHOTGUN, x: iconPadding * 2 + iconSize },
  { weapon: WEAPONS.LASER, x: iconPadding * 3 + iconSize * 2 },
  { weapon: WEAPONS.KNIFE, x: iconPadding * 4 + iconSize * 3 },
  { weapon: WEAPONS.ICE, x: iconPadding * 5 + iconSize * 4 }
];

const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 100,
  width: 30,
  height: 30,
  speed: 6,
  color: '#00f7ff'
};

let bullets = [];
let enemies = [];
let enemySpawnTimer = 0;
const enemySpawnInterval = 60;

const keys = {};

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', (event) => {
  if (gameState !== 'playing') return;

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  let clickedIcon = false;
  for (let icon of weaponIcons) {
    if (
      clickX >= icon.x &&
      clickX <= icon.x + iconSize &&
      clickY >= iconY &&
      clickY <= iconY + iconSize
    ) {
      currentWeapon = icon.weapon;
      clickedIcon = true;
      break;
    }
  }

  if (!clickedIcon) {
    useWeapon();
  }
});

function startGame() {
  gameState = 'playing';
  score = 0;
  playerHealth = 100;
  bullets = [];
  enemies = [];
  player.x = canvas.width / 2 - 15;
  currentWeapon = WEAPONS.PISTOL;

  ammo[WEAPONS.PISTOL.id] = WEAPONS.PISTOL.maxAmmo;
  ammo[WEAPONS.SHOTGUN.id] = WEAPONS.SHOTGUN.maxAmmo;
  ammo[WEAPONS.LASER.id] = WEAPONS.LASER.maxAmmo;
  isReloading[WEAPONS.PISTOL.id] = false;
  isReloading[WEAPONS.SHOTGUN.id] = false;
  isReloading[WEAPONS.LASER.id] = false;

  iceCharges = ICE_MAX_CHARGES;
  isIceOnCooldown = false;

  menuScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  canvas.classList.remove('hidden');

  // Запуск восстановления
  if (healInterval) clearInterval(healInterval);
  healInterval = setInterval(() => {
    if (gameState === 'playing' && isPlayerInSafeHouse() && playerHealth < 100) {
      playerHealth = Math.min(100, playerHealth + 2);
    }
  }, 1000); // каждую секунду

  gameLoop();
}

function useWeapon() {
  if (currentWeapon === WEAPONS.KNIFE) {
    useKnife();
  } else if (currentWeapon === WEAPONS.ICE) {
    useIce();
  } else {
    if (isReloading[currentWeapon.id]) return;
    if (ammo[currentWeapon.id] <= 0) {
      startReload(currentWeapon);
      return;
    }
    shoot();
    ammo[currentWeapon.id]--;
    if (ammo[currentWeapon.id] === 0) {
      startReload(currentWeapon);
    }
  }
}

function startReload(weapon) {
  isReloading[weapon.id] = true;
  setTimeout(() => {
    ammo[weapon.id] = weapon.maxAmmo;
    isReloading[weapon.id] = false;
  }, weapon.reloadTime);
}

function useIce() {
  if (iceCharges <= 0 || isIceOnCooldown) return;

  for (let enemy of enemies) {
    enemy.frozen = true;
    enemy.freezeEndTime = Date.now() + 6000;
  }

  iceCharges--;
  if (iceCharges === 0) {
    isIceOnCooldown = true;
    setTimeout(() => {
      iceCharges = ICE_MAX_CHARGES;
      isIceOnCooldown = false;
    }, 12000);
  }
}

function useKnife() {
  const knifeRange = 100;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const enemyCenterX = e.x + e.width / 2;
    const enemyCenterY = e.y + e.height / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < knifeRange) {
      enemies.splice(i, 1);
      score += 25;
    }
  }
}

function shoot() {
  const centerX = player.x + player.width / 2;
  const startY = player.y;

  switch (currentWeapon) {
    case WEAPONS.PISTOL:
      bullets.push({ x: centerX - 2, y: startY, width: 4, height: 10, speed: 8, damage: 10, color: '#ff2a6d' });
      break;
    case WEAPONS.SHOTGUN:
      bullets.push({ x: centerX - 2, y: startY, width: 4, height: 8, speed: 7, damage: 8, color: '#ff9800' });
      bullets.push({ x: centerX - 10, y: startY, width: 4, height: 8, speed: 6, angle: -0.3, damage: 8, color: '#ff9800' });
      bullets.push({ x: centerX + 6, y: startY, width: 4, height: 8, speed: 6, angle: 0.3, damage: 8, color: '#ff9800' });
      break;
    case WEAPONS.LASER:
      bullets.push({ x: centerX - 3, y: startY, width: 6, height: 15, speed: 5, damage: 30, color: '#00f7ff' });
      break;
  }
}

function spawnEnemy() {
  const size = 20 + Math.random() * 20;
  enemies.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    width: size,
    height: size,
    speed: 1 + Math.random() * 2.5,
    health: 30,
    color: '#ffff00',
    frozen: false,
    freezeEndTime: 0
  });
}

function isPlayerInSafeHouse() {
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;
  return (
    cx >= SAFE_HOUSE.x &&
    cx <= SAFE_HOUSE.x + SAFE_HOUSE.width &&
    cy >= SAFE_HOUSE.y &&
    cy <= SAFE_HOUSE.y + SAFE_HOUSE.height
  );
}

function update() {
  if (gameState !== 'playing') return;

  if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
  if (keys['d'] || keys['arrowright']) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed;
    if (b.angle) b.x += Math.sin(b.angle) * b.speed;
    if (b.y < 0 || b.x < 0 || b.x > canvas.width) bullets.splice(i, 1);
  }

  enemySpawnTimer++;
  if (enemySpawnTimer >= enemySpawnInterval) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  const now = Date.now();
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.frozen && now >= e.freezeEndTime) e.frozen = false;
    if (!e.frozen) e.y += e.speed;
    if (e.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.health -= b.damage;
        bullets.splice(j, 1);
        if (e.health <= 0) {
          enemies.splice(i, 1);
          score += 20;
        }
        break;
      }
    }
  }

  if (!isPlayerInSafeHouse()) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (
        player.x < e.x + e.width &&
        player.x + player.width > e.x &&
        player.y < e.y + e.height &&
        player.y + player.height > e.y
      ) {
        playerHealth -= 25;
        enemies.splice(i, 1);

        if (playerHealth <= 0) {
          playerHealth = 0;
          gameOver();
          return;
        }
      }
    }
  }
}

function drawBackground() {
  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ff2a6d');
  sky.addColorStop(0.5, '#d147ff');
  sky.addColorStop(1, '#0a0033');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, h - 100, w, 100);

  ctx.fillStyle = '#795548';
  ctx.fillRect(SAFE_HOUSE.x, SAFE_HOUSE.y, SAFE_HOUSE.width, SAFE_HOUSE.height);

  ctx.beginPath();
  ctx.moveTo(SAFE_HOUSE.x - 10, SAFE_HOUSE.y);
  ctx.lineTo(SAFE_HOUSE.x + SAFE_HOUSE.width / 2, SAFE_HOUSE.y - 30);
  ctx.lineTo(SAFE_HOUSE.x + SAFE_HOUSE.width + 10, SAFE_HOUSE.y);
  ctx.closePath();
  ctx.fillStyle = '#5d4037';
  ctx.fill();

  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(SAFE_HOUSE.x + 20, SAFE_HOUSE.y + 30, 25, 25);

  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SAFE', SAFE_HOUSE.x + SAFE_HOUSE.width / 2, SAFE_HOUSE.y + SAFE_HOUSE.height - 10);
}

function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 20;
  const x = canvas.width / 2 - barWidth / 2;
  const y = 10;

  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, barWidth, barHeight);

  const healthPercent = playerHealth / 100;
  const healthWidth = barWidth * healthPercent;

  const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#ffff00');
  gradient.addColorStop(1, '#00ff00');

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, healthWidth, barHeight);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`HP: ${Math.round(playerHealth)}/100`, x + barWidth / 2, y + barHeight / 2 + 4);
}

function drawWeaponIcons() {
  for (let icon of weaponIcons) {
    const x = icon.x;
    const y = iconY;
    const isActive = currentWeapon === icon.weapon;
    let isDisabled = false;
    let label = '';

    if (icon.weapon === WEAPONS.ICE) {
      isDisabled = isIceOnCooldown || iceCharges <= 0;
      label = `${iceCharges}`;
    } else if ([WEAPONS.PISTOL, WEAPONS.SHOTGUN, WEAPONS.LASER].includes(icon.weapon)) {
      const reloading = isReloading[icon.weapon.id];
      const currentAmmo = ammo[icon.weapon.id];
      isDisabled = reloading;
      if (reloading) {
        label = '⏳';
      } else {
        label = `${currentAmmo}/${icon.weapon.maxAmmo}`;
      }
    }

    ctx.fillStyle = isDisabled ? '#555' : (isActive ? '#4fc3f7' : '#333');
    ctx.fillRect(x, y, iconSize, iconSize);

    ctx.strokeStyle = isActive ? '#ffffff' : (isDisabled ? '#777' : '#666');
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, iconSize, iconSize);

    ctx.fillStyle = isDisabled ? '#888' : 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let symbol = '';
    if (icon.weapon === WEAPONS.PISTOL) symbol = '🔫';
    if (icon.weapon === WEAPONS.SHOTGUN) symbol = '💥';
    if (icon.weapon === WEAPONS.LASER) symbol = '⚡';
    if (icon.weapon === WEAPONS.KNIFE) symbol = '🗡️';
    if (icon.weapon === WEAPONS.ICE) symbol = '❄️';

    ctx.fillText(symbol, x + iconSize / 2, y + iconSize / 2 - 5);

    ctx.fillStyle = isDisabled ? '#aaa' : (icon.weapon === WEAPONS.ICE ? '#ffeb3b' : '#4caf50');
    ctx.font = 'bold 12px Arial';
    ctx.fillText(label, x + iconSize / 2, y + iconSize / 2 + 12);
  }
}

function draw() {
  drawBackground();
  drawHealthBar();

  ctx.fillStyle = isPlayerInSafeHouse() ? '#66bb66' : player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  for (let b of bullets) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }

  for (let e of enemies) {
    ctx.fillStyle = e.frozen ? '#a0f0ff' : e.color;
    ctx.fillRect(e.x, e.y, e.width, e.height);
  }

  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Очки: ${score}`, 10, 30);

  drawWeaponIcons();
}

function gameOver() {
  gameState = 'gameOver';
  if (healInterval) {
    clearInterval(healInterval);
    healInterval = null;
  }
  finalScoreEl.textContent = score;
  canvas.classList.add('hidden');
  resultScreen.classList.remove('hidden');
}

function gameLoop() {
  if (gameState !== 'playing') return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}