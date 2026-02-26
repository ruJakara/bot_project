let score = 0;
let misses = 0;
let timeLeft = 60;
let gameStartTime = null; // ← для расчёта скорости
let timerId = null;
let moveTimeout = null;
let currentLevel = 'easy';
let clickSound = null;
let gameActive = false;
let gamePaused = false;

const levels = {
    easy: { time: 60, starSize: 60, autoMoveDelay: 5000 },
    medium: { time: 45, starSize: 50, autoMoveDelay: 4000 },
    hard: { time: 30, starSize: 35, autoMoveDelay: 3000 },
    expert: { time: 20, starSize: 25, autoMoveDelay: 2000 } // ← НОВЫЙ УРОВЕНЬ
};

// DOM
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const recordInfo = document.getElementById('record-info');
const star = document.getElementById('star');

// Пауза оверлей
const pauseOverlay = document.createElement('div');
pauseOverlay.id = 'pause-overlay';
pauseOverlay.innerHTML = '<p>ПАУЗА<br><small>Нажмите P/З или кнопку</small></p>';
pauseOverlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 2rem;
    z-index: 2000;
    display: none;
`;
document.body.appendChild(pauseOverlay);

// Обработчик промахов
function handleClickAnywhere(e) {
    if (!gameActive || gamePaused) return;
    if (e.target === star || star.contains(e.target)) return;
    misses++;
}
document.addEventListener('click', handleClickAnywhere);

// Клавиши: P и З
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ((key === 'p' || key === 'з') && gameActive) {
        togglePause();
    }
});

if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
}

startBtn.addEventListener('click', showLevelSelect);
restartBtn.addEventListener('click', showLevelSelect);

function showLevelSelect() {
    const level = prompt(
        "Выбери уровень:\n" +
        "1 — Легко (60 сек)\n" +
        "2 — Средне (45 сек)\n" +
        "3 — Сложно (30 сек)\n" +
        "4 — Эксперт (20 сек)"
    );

    switch (level) {
        case '1': currentLevel = 'easy'; break;
        case '2': currentLevel = 'medium'; break;
        case '3': currentLevel = 'hard'; break;
        case '4': currentLevel = 'expert'; break;
        default:
            alert("Неверный ввод. Выбран уровень: Легко");
            currentLevel = 'easy';
    }

    startGame();
}

function startGame() {
    const level = levels[currentLevel];
    timeLeft = level.time;
    resetGame();
    switchScreen('game');
    gameActive = true;
    gamePaused = false;
    gameStartTime = Date.now(); // ← запоминаем время старта
    pauseOverlay.style.display = 'none';
    startTimer();
    moveStar();

    if (!clickSound) {
        clickSound = new Audio('sound/click.mp3');
        clickSound.volume = 0.3;
    }
}

function resetGame() {
    score = 0;
    misses = 0;
    updateScore();
    updateTimer();
    if (timerId) clearInterval(timerId);
    if (moveTimeout) clearTimeout(moveTimeout);
    timerId = null;
    moveTimeout = null;
    gamePaused = false;
    pauseOverlay.style.display = 'none';

    const size = levels[currentLevel].starSize;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = '50%';
    star.style.top = '50%';
    star.style.transform = 'translate(-50%, -50%)';
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        if (!gamePaused) {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function updateTimer() {
    timerDisplay.textContent = `Время: ${timeLeft}`;
}

function updateScore() {
    scoreDisplay.textContent = `Очки: ${score}`;
}

function moveStar() {
    if (!gameActive || gamePaused) return;

    if (moveTimeout) clearTimeout(moveTimeout);

    star.removeEventListener('click', catchStar);

    const size = levels[currentLevel].starSize;
    const maxX = Math.max(0, window.innerWidth - size);
    const maxY = Math.max(0, window.innerHeight - size);
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;

    star.style.left = `${newX}px`;
    star.style.top = `${newY}px`;
    star.style.transform = 'none';

    star.addEventListener('click', catchStar);

    const delay = levels[currentLevel].autoMoveDelay;
    moveTimeout = setTimeout(() => {
        if (gameActive && !gamePaused) {
            moveStar();
        }
    }, delay);
}

function catchStar(e) {
    e.stopPropagation();
    if (!gameActive || gamePaused) return;

    if (moveTimeout) clearTimeout(moveTimeout);

    score++;
    updateScore();

    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(err => console.warn("Звук не проигрался:", err));
    }

    setTimeout(() => {
        if (gameActive && !gamePaused) moveStar();
    }, 100);
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseOverlay.style.display = 'flex';
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = null;
    } else {
        pauseOverlay.style.display = 'none';
        if (gameActive) moveStar();
    }
}

function endGame() {
    gameActive = false;
    gamePaused = false;
    if (timerId) clearInterval(timerId);
    if (moveTimeout) clearTimeout(moveTimeout);
    timerId = null;
    moveTimeout = null;
    pauseOverlay.style.display = 'none';

    const gameTime = (Date.now() - gameStartTime) / 1000; // в секундах
    const speed = gameTime > 0 ? (score / gameTime).toFixed(2) : 0;

    finalScoreDisplay.textContent = `Ваш результат: ${score}`;

    const totalClicks = score + misses;
    const accuracy = totalClicks > 0 ? Math.round((score / totalClicks) * 100) : 0;

    // Удаляем старую статистику
    const oldStats = document.getElementById('stats');
    if (oldStats) oldStats.remove();

    const statsElement = document.createElement('p');
    statsElement.id = 'stats';
    statsElement.style.color = '#aaa';
    statsElement.style.marginTop = '8px';
    statsElement.innerHTML = `
        Промахов: ${misses} | Точность: ${accuracy}%<br>
        Скорость: ${speed} звёзд/сек
    `;

    resultScreen.insertBefore(statsElement, restartBtn);

    // Рекорд
    const recordKey = `record_${currentLevel}`;
    const best = localStorage.getItem(recordKey) || 0;
    let isNewRecord = false;

    if (score > best) {
        localStorage.setItem(recordKey, score);
        isNewRecord = true;
    }

    if (isNewRecord) {
        recordInfo.textContent = '🏆 НОВЫЙ РЕКОРД!';
        recordInfo.style.color = '#ffcc00';
    } else {
        recordInfo.textContent = `Рекорд: ${best}`;
        recordInfo.style.color = '#ffcc00';
    }

    switchScreen('result');
    sendResultToBot(score);
}

function switchScreen(screenName) {
    menuScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    resultScreen.classList.remove('active');

    if (screenName === 'menu') menuScreen.classList.add('active');
    else if (screenName === 'game') gameScreen.classList.add('active');
    else if (screenName === 'result') resultScreen.classList.add('active');
}