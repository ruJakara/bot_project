// ПЕРЕМЕННЫЕ
let score = 0;
let totalPoints = 0;
let timeLeft = GAME_DURATION;
let gameActive = false;
let timerId = null;
let buttonTimer = null;

// 12 УЛУЧШЕНИЙ
let upgrades = {
  speed: { level: 0, cost: 50 },
  points: { level: 0, cost: 80 },
  buttons: { level: 0, cost: 150 },
  lifetime: { level: 0, cost: 60 },
  maxActive: { level: 0, cost: 100 },
  autoClick: { level: 0, cost: 250 },
  double: { level: 0, cost: 400 },
  triple: { level: 0, cost: 600 },
  passive: { level: 0, cost: 300 },
  instant: { level: 0, cost: 200 },
  bonus: { level: 0, cost: 120 },
  collector: { level: 0, cost: 180 }
};

// ЗАГРУЗКА СОХРАНЕННОГО
function loadGame() {
  const saved = localStorage.getItem('neonHacker');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      totalPoints = data.points || 0;
      upgrades = data.upgrades || upgrades;
      
      updateUI();
      renderUpgrades();
    } catch (e) {
      console.log("Ошибка загрузки:", e);
    }
  }
}

// СОХРАНЕНИЕ
function saveGame() {
  const data = {
    points: totalPoints,
    upgrades: upgrades
  };
  localStorage.setItem('neonHacker', JSON.stringify(data));
}

// УРОВЕНЬ ИГРОКА
function calculateLevel() {
  let sum = 0;
  for (let k in upgrades) sum += upgrades[k].level;
  return Math.floor(sum / 2) + 1;
}

// СОЗДАТЬ КНОПКИ
function createButtons() {
  const container = document.getElementById('buttons');
  container.innerHTML = '';
  
  const count = 9 + Math.min(upgrades.buttons.level, 7);
  const size = count <= 9 ? 3 : 4;
  
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('div');
    btn.className = 'btn-game';
    btn.innerHTML = '🔒';
    btn.addEventListener('click', () => clickButton(btn));
    container.appendChild(btn);
  }
  
  container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
}

// КЛИК ПО КНОПКЕ
function clickButton(btn) {
  if (!gameActive || !btn.classList.contains('active')) return;
  
  let pts = 1 + upgrades.points.level * 0.6 + upgrades.bonus.level * 0.4;
  
  if (upgrades.double.level > 0 && Math.random() < 0.18) {
    pts *= 2;
    showEffect(btn, 'x2');
  } else if (upgrades.triple.level > 0 && Math.random() < 0.1) {
    pts *= 3;
    showEffect(btn, 'x3');
  } else {
    showEffect(btn, '✅');
  }
  
  score += pts;
  document.getElementById('score').textContent = Math.floor(score);
}

// ЭФФЕКТ НА КНОПКЕ
function showEffect(btn, text) {
  btn.classList.remove('active');
  btn.innerHTML = text;
  btn.style.transform = 'scale(0.85)';
  
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = '🔒';
      btn.style.transform = '';
    }
  }, 300);
}

// АКТИВИРОВАТЬ КНОПКУ
function activateRandomButton() {
  if (!gameActive) return;
  
  const all = document.querySelectorAll('.btn-game');
  const active = Array.from(all).filter(b => b.classList.contains('active'));
  
  const max = 3 + upgrades.maxActive.level;
  if (active.length >= max) return;
  
  const inactive = Array.from(all).filter(b => !b.classList.contains('active'));
  if (inactive.length === 0) return;
  
  const btn = inactive[Math.floor(Math.random() * inactive.length)];
  btn.classList.add('active');
  btn.innerHTML = '🔓';
  
  const life = 1400 + upgrades.lifetime.level * 250;
  
  setTimeout(() => {
    if (btn.classList.contains('active')) {
      if (upgrades.collector.level > 0 && Math.random() < 0.35 * upgrades.collector.level) {
        clickButton(btn);
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '🔒';
      }
    }
  }, life);
}

// СТАРТ ИГРЫ
function startGame() {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  
  score = 0;
  timeLeft = GAME_DURATION;
  gameActive = true;
  
  document.getElementById('score').textContent = '0';
  document.getElementById('timer').textContent = timeLeft;
  
  createButtons();
  
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
  
  clearInterval(buttonTimer);
  const speed = Math.max(250, 580 - upgrades.speed.level * 45);
  buttonTimer = setInterval(activateRandomButton, speed);
  
  // Автокликер
  if (upgrades.autoClick.level > 0) {
    setInterval(() => {
      if (!gameActive) return;
      const active = document.querySelectorAll('.btn-game.active');
      if (active.length > 0) {
        clickButton(active[Math.floor(Math.random() * active.length)]);
      }
    }, 1000 / upgrades.autoClick.level);
  }
  
  // Пассивный доход
  if (upgrades.passive.level > 0) {
    setInterval(() => {
      if (gameActive) {
        score += 0.4 * upgrades.passive.level;
        document.getElementById('score').textContent = Math.floor(score);
      }
    }, 1000);
  }
}

// КОНЕЦ ИГРЫ
function endGame() {
  gameActive = false;
  clearInterval(timerId);
  clearInterval(buttonTimer);
  
  totalPoints += Math.floor(score);
  
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-result').classList.add('active');
  
  document.getElementById('result-score').textContent = Math.floor(score);
  document.getElementById('result-total').textContent = totalPoints;
  document.getElementById('result-level').textContent = calculateLevel();
  
  saveGame();
  updateUI();
  sendGameResult({ score: Math.floor(score), total: totalPoints, level: calculateLevel() });
}

// ОБНОВИТЬ ИНТЕРФЕЙС
function updateUI() {
  document.getElementById('total-points').textContent = totalPoints;
  document.getElementById('shop-points').textContent = totalPoints;
  document.getElementById('player-level').textContent = calculateLevel();
}

// ОТОБРАЗИТЬ УЛУЧШЕНИЯ
function renderUpgrades() {
  const list = document.getElementById('upgrades-list');
  list.innerHTML = '';
  
  const items = [
    { id: 'speed', name: '⚡ Скорость', desc: 'Кнопки появляются быстрее' },
    { id: 'points', name: '💰 +Очки', desc: '+0.6 очков за клик' },
    { id: 'buttons', name: '➕ Кнопки', desc: 'До +7 кнопок на поле' },
    { id: 'lifetime', name: '⏳ Время', desc: 'Кнопки горят дольше' },
    { id: 'maxActive', name: '🎯 Одновременно', desc: 'Больше активных кнопок' },
    { id: 'bonus', name: '🎁 Бонус', desc: '+0.4 очка за каждый клик' },
    { id: 'autoClick', name: '🤖 Автокликер', desc: 'Кликает сам за тебя' },
    { id: 'collector', name: '🧹 Собиратель', desc: 'Ловит пропущенные кнопки' },
    { id: 'double', name: '✨ x2 шанс', desc: '18% шанс удвоить очки' },
    { id: 'triple', name: '🌟 x3 шанс', desc: '10% шанс утроить очки' },
    { id: 'passive', name: '📈 Пассив', desc: 'Очки каждую секунду' },
    { id: 'instant', name: '⚡ Мгновенно', desc: 'Быстрая активация кнопок' }
  ];
  
  items.forEach(item => {
    const level = upgrades[item.id].level;
    const cost = Math.floor(upgrades[item.id].cost * Math.pow(1.42, level));
    const canBuy = totalPoints >= cost && level < 10;
    
    const div = document.createElement('div');
    div.className = 'upgrade ' + (canBuy ? '' : 'disabled');
    div.innerHTML = `
      <div class="upgrade-title">${item.name}</div>
      <div class="upgrade-cost">${cost}</div>
      <div class="upgrade-desc">${item.desc}</div>
      <div class="upgrade-level">Уровень ${level}${level >= 10 ? ' (макс.)' : ''}</div>
    `;
    
    if (canBuy) {
      div.onclick = () => buyUpgrade(item.id);
    }
    
    list.appendChild(div);
  });
}

// КУПИТЬ УЛУЧШЕНИЕ
function buyUpgrade(id) {
  const level = upgrades[id].level;
  if (level >= 10) return;
  
  const cost = Math.floor(upgrades[id].cost * Math.pow(1.42, level));
  if (totalPoints < cost) return;
  
  totalPoints -= cost;
  upgrades[id].level++;
  
  updateUI();
  renderUpgrades();
  saveGame();
}

// КНОПКИ
document.getElementById('btn-start').onclick = startGame;
document.getElementById('btn-restart').onclick = () => {
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-start').classList.add('active');
};
document.getElementById('btn-shop').onclick = () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-shop').classList.add('active');
  renderUpgrades();
};
document.getElementById('btn-shop-again').onclick = () => {
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-shop').classList.add('active');
  renderUpgrades();
};
document.getElementById('btn-back').onclick = () => {
  document.getElementById('screen-shop').classList.remove('active');
  document.getElementById('screen-start').classList.add('active');
};

// СТАРТ
loadGame();