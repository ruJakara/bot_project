// game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Инициализация DOM ---
    DOM.menuScreen = document.getElementById('menu-screen');
    DOM.gameScreen = document.getElementById('game-screen');
    DOM.levelGrid = document.getElementById('level-grid');
    DOM.completedLevelsSpan = document.getElementById('completed-levels');
    DOM.resetProgressBtn = document.getElementById('reset-progress');
    DOM.backToMenuBtn = document.getElementById('back-to-menu');
    DOM.transitionOverlay = document.getElementById('transition-overlay');
    
    DOM.board = document.getElementById('game-board');
    DOM.movesSpan = document.getElementById('moves-count');
    DOM.pairsSpan = document.getElementById('pairs-count');
    DOM.levelIndicator = document.getElementById('level-indicator');
    DOM.restartLevelBtn = document.getElementById('restart-level');
    DOM.nextLevelBtn = document.getElementById('next-level');

    // --- Состояние игры ---
    let currentLevelData = null;
    let cards = [];
    let openedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let lockBoard = false;
    let timeoutId = null;

    // --- Загрузка прогресса ---
    loadProgress();

    // --- Вспомогательные функции ---
    function updateStats() {
        DOM.movesSpan.textContent = moves;
        DOM.pairsSpan.textContent = matchedPairs;
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function clearGameTimeouts() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    }

    // Создание колоды для уровня
    function createDeckForLevel(level) {
        const deck = [];
        const pairsNeeded = level.pairs;
        
        // Берем нужное количество стихий из config (циклически, если не хватает)
        for (let i = 0; i < pairsNeeded; i++) {
            const elementIndex = i % GAME_CONFIG.elements.length;
            const element = GAME_CONFIG.elements[elementIndex];
            
            deck.push({ 
                id: i * 2, 
                element: element.name, 
                symbol: element.symbol, 
                matched: false 
            });
            deck.push({ 
                id: i * 2 + 1, 
                element: element.name, 
                symbol: element.symbol, 
                matched: false 
            });
        }
        
        return shuffleArray(deck);
    }

    // Проверка на победу
    function checkWin() {
        if (matchedPairs === currentLevelData.pairs) {
            // Победа!
            DOM.board.classList.add('level-complete-animation');
            setTimeout(() => DOM.board.classList.remove('level-complete-animation'), 500);
            
            // Отметить уровень как пройденный
            if (!gameProgress.completedLevels.includes(currentLevelData.id)) {
                gameProgress.completedLevels.push(currentLevelData.id);
                
                // Разблокировать следующий уровень
                if (currentLevelData.id < GAME_CONFIG.levels.length) {
                    gameProgress.currentLevel = currentLevelData.id + 1;
                }
                
                saveProgress();
            }
            
            // Показать кнопку следующего уровня, если не последний
            if (currentLevelData.id < GAME_CONFIG.levels.length) {
                DOM.nextLevelBtn.classList.remove('hidden');
            } else {
                // Финальный уровень
                setTimeout(() => {
                    alert('🌟 Ты прошел Восхождение! Храм открыл все тайны! 🌟');
                }, 300);
            }
        }
    }

    // --- Обработка клика по карте ---
    function handleCardClick(index) {
        if (lockBoard) return;
        if (cards[index].matched) return;
        if (openedCards.includes(index)) return;
        if (openedCards.length === 2) return;

        const cardElement = document.querySelectorAll('.card')[index];
        cardElement.classList.add('flipped');
        openedCards.push(index);

        if (openedCards.length === 2) {
            moves++;
            updateStats();
            lockBoard = true;

            const firstCardIndex = openedCards[0];
            const secondCardIndex = openedCards[1];
            const firstCard = cards[firstCardIndex];
            const secondCard = cards[secondCardIndex];

            if (firstCard.element === secondCard.element) {
                // Совпадение
                firstCard.matched = true;
                secondCard.matched = true;

                const firstElem = document.querySelectorAll('.card')[firstCardIndex];
                const secondElem = document.querySelectorAll('.card')[secondCardIndex];
                firstElem.classList.add('matched');
                secondElem.classList.add('matched');

                matchedPairs++;
                updateStats();
                openedCards = [];
                lockBoard = false;

                checkWin();
            } else {
                // Не совпали
                clearGameTimeouts();
                timeoutId = setTimeout(() => {
                    const elements = document.querySelectorAll('.card');
                    if (!cards[firstCardIndex].matched) {
                        elements[firstCardIndex].classList.remove('flipped');
                    }
                    if (!cards[secondCardIndex].matched) {
                        elements[secondCardIndex].classList.remove('flipped');
                    }
                    openedCards = [];
                    lockBoard = false;
                    timeoutId = null;
                }, GAME_CONFIG.matchCheckDelay);
            }
        }
    }

    // --- Отрисовка доски ---
    function renderBoard() {
        DOM.board.innerHTML = '';
        
        // Вычисляем количество колонок для сетки
        const totalCards = cards.length;
        let columns = 4;
        if (totalCards > 20) columns = 6;
        if (totalCards > 30) columns = 8;
        
        DOM.board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        cards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            if (card.matched) {
                cardDiv.classList.add('matched', 'flipped');
            }

            cardDiv.innerHTML = `
                <div class="card-front" data-element="${card.element}">${card.symbol}</div>
                <div class="card-back"></div>
            `;

            cardDiv.addEventListener('click', () => handleCardClick(index));
            DOM.board.appendChild(cardDiv);
        });
    }

    // --- Загрузка уровня ---
    function loadLevel(levelId) {
        clearGameTimeouts();
        
        // Найти данные уровня
        const level = GAME_CONFIG.levels.find(l => l.id === levelId);
        if (!level) return;
        
        currentLevelData = level;
        
        // Обновить индикатор
        DOM.levelIndicator.textContent = `Уровень ${level.id}: ${level.name}`;
        
        // Создать колоду
        cards = createDeckForLevel(level);
        openedCards = [];
        matchedPairs = 0;
        moves = 0;
        lockBoard = false;
        
        // Скрыть кнопку следующего уровня
        DOM.nextLevelBtn.classList.add('hidden');
        
        // Обновить статистику
        updateStats();
        
        // Отрисовать доску
        renderBoard();
    }

    // --- Переход на следующий уровень ---
    function goToNextLevel() {
        if (currentLevelData.id < GAME_CONFIG.levels.length) {
            // Эффект перехода
            DOM.transitionOverlay.classList.add('active');
            setTimeout(() => {
                loadLevel(currentLevelData.id + 1);
                DOM.transitionOverlay.classList.remove('active');
            }, 300);
        }
    }

    // --- Отрисовка меню уровней ---
    function renderLevelMenu() {
        DOM.levelGrid.innerHTML = '';
        
        GAME_CONFIG.levels.forEach(level => {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            
            // Проверка доступности
            if (gameProgress.completedLevels.includes(level.id)) {
                levelItem.classList.add('completed');
            } else if (level.id > gameProgress.currentLevel) {
                levelItem.classList.add('locked');
            }
            
            levelItem.innerHTML = `
                <span class="level-number">${level.id}</span>
                <span class="level-cards">${level.pairs} пар</span>
                <span class="level-name">${level.name}</span>
            `;
            
            // Обработчик клика
            levelItem.addEventListener('click', () => {
                if (!levelItem.classList.contains('locked')) {
                    // Эффект перехода
                    DOM.transitionOverlay.classList.add('active');
                    setTimeout(() => {
                        DOM.menuScreen.classList.add('hidden');
                        DOM.gameScreen.classList.remove('hidden');
                        loadLevel(level.id);
                        DOM.transitionOverlay.classList.remove('active');
                    }, 300);
                }
            });
            
            DOM.levelGrid.appendChild(levelItem);
        });
        
        // Обновить счетчик пройденных уровней
        DOM.completedLevelsSpan.textContent = gameProgress.completedLevels.length;
    }

    // --- Возврат в меню ---
    function goToMenu() {
        DOM.transitionOverlay.classList.add('active');
        setTimeout(() => {
            DOM.gameScreen.classList.add('hidden');
            DOM.menuScreen.classList.remove('hidden');
            renderLevelMenu();
            DOM.transitionOverlay.classList.remove('active');
        }, 300);
    }

    // --- Сброс прогресса ---
    function resetAllProgress() {
        if (confirm('Ты действительно хочешь забыть все тайны храма?')) {
            resetProgress();
            renderLevelMenu();
        }
    }

    // --- Инициализация ---
    function initGame() {
        // Рендерим меню
        renderLevelMenu();
        
        // Обработчики событий
        DOM.resetProgressBtn.addEventListener('click', resetAllProgress);
        DOM.backToMenuBtn.addEventListener('click', goToMenu);
        DOM.restartLevelBtn.addEventListener('click', () => {
            if (currentLevelData) {
                loadLevel(currentLevelData.id);
            }
        });
        DOM.nextLevelBtn.addEventListener('click', goToNextLevel);
    }

    // Запуск
    initGame();
});