// Основной игровой код
class HamsterHotelGame {
    constructor() {
        this.gameState = {
            coins: CONFIG.START_COINS,
            timeLeft: CONFIG.GAME_DURATION,
            rooms: [],
            queue: [],
            servedHamsters: 0,
            unlockedRooms: 1,
            gameActive: false,
            timerInterval: null,
            queueInterval: null
        };
        
        // Типы хомячков с разными окрасами
        this.hamsterTypes = [
            { name: "Золотистый", color: "#d2b48c", type: "hamster-type-1" },
            { name: "Коричневый", color: "#a0522d", type: "hamster-type-2" },
            { name: "Песочный", color: "#f5deb3", type: "hamster-type-3" },
            { name: "Серый", color: "#8b7355", type: "hamster-type-4" },
            { name: "Медовый", color: "#deb887", type: "hamster-type-5" },
            { name: "Бежевый", color: "#f5f5dc", type: "hamster-type-6" }
        ];
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupAPI();
        this.createRooms();
        
        setTimeout(() => {
            this.showScreen('startScreen');
        }, 100);
    }
    
    cacheElements() {
        // Экраны
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultScreen = document.getElementById('resultScreen');
        
        // Кнопки
        this.startBtn = document.getElementById('startBtn');
        this.menuBtn = document.getElementById('menuBtn');
        this.menuBtn2 = document.getElementById('menuBtn2');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Игровые элементы
        this.timerElement = document.getElementById('timer');
        this.coinsElement = document.getElementById('coins');
        this.roomsContainer = document.getElementById('rooms');
        this.queueContainer = document.getElementById('hamsterQueue');
        
        // Элементы результатов
        this.finalCoinsElement = document.getElementById('finalCoins');
        this.finalHamstersElement = document.getElementById('finalHamsters');
        this.finalRoomsElement = document.getElementById('finalRooms');
        this.resultMessageElement = document.getElementById('resultMessage');
    }
    
    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startGame());
        }
        
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.showScreen('startScreen'));
        }
        
        if (this.menuBtn2) {
            this.menuBtn2.addEventListener('click', () => this.showScreen('startScreen'));
        }
        
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.startGame());
        }
        
        if (this.roomsContainer) {
            this.roomsContainer.addEventListener('click', (e) => this.handleRoomClick(e));
        }
        
        if (this.queueContainer) {
            this.queueContainer.addEventListener('click', (e) => this.handleHamsterClick(e));
        }
    }
    
    setupAPI() {
        if (typeof TelegramAPI !== 'undefined') {
            this.api = TelegramAPI;
            
            this.api.handleMainButtonClick = () => {
                if (this.gameState.gameActive) {
                    this.api.hideMainButton();
                } else {
                    this.startGame();
                }
            };
        } else {
            this.api = {
                sendGameResult: (data) => {
                    console.log('Mock отправка результата:', data);
                    return true;
                },
                hideMainButton: () => {},
                showMainButton: () => {},
                isInTelegram: () => false
            };
        }
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const screenElement = document.getElementById(screenId);
        if (screenElement) {
            screenElement.classList.add('active');
        }
        
        if (screenId === 'startScreen') {
            this.stopGame();
        }
    }
    
    createRooms() {
        if (!this.roomsContainer) return;
        
        this.roomsContainer.innerHTML = '';
        
        for (let i = 1; i <= 6; i++) {
            const room = document.createElement('div');
            room.className = i <= this.gameState.unlockedRooms ? 'room unlocked' : 'room locked';
            room.dataset.roomId = i;
            
            room.innerHTML = `
                <div class="room-number">№${i}</div>
                <div class="room-status">${i <= this.gameState.unlockedRooms ? 'Свободен' : 'Заблокирован'}</div>
                <div class="room-interior">
                    <div class="room-furniture">
                        <div class="furniture-item window">🪟</div>
                        <div class="furniture-item bed">🛏️</div>
                        <div class="furniture-item tv">📺</div>
                        <div class="furniture-item clock">⏰</div>
                    </div>
                    <div class="room-hamster"></div>
                </div>
                ${i > this.gameState.unlockedRooms ? 
                    `<div class="room-price">${CONFIG.ROOM_PRICES[i]} монет</div>` : 
                    '<div class="room-ready">✓ Готов</div>'}
            `;
            
            this.roomsContainer.appendChild(room);
            
            this.gameState.rooms[i] = {
                id: i,
                occupied: false,
                hamster: null,
                unlocked: i <= this.gameState.unlockedRooms
            };
        }
    }
    
    startGame() {
        if (this.api && this.api.hideMainButton) {
            this.api.hideMainButton();
        }
        
        this.gameState = {
            coins: CONFIG.START_COINS,
            timeLeft: CONFIG.GAME_DURATION,
            rooms: [],
            queue: [],
            servedHamsters: 0,
            unlockedRooms: 1,
            gameActive: true,
            timerInterval: null,
            queueInterval: null
        };
        
        this.updateUI();
        this.createRooms();
        this.showScreen('gameScreen');
        this.startTimer();
        this.startHamsterGeneration();
        this.addHamsterToQueue();
    }
    
    stopGame() {
        this.gameState.gameActive = false;
        
        if (this.gameState.timerInterval) {
            clearInterval(this.gameState.timerInterval);
            this.gameState.timerInterval = null;
        }
        
        if (this.gameState.queueInterval) {
            clearInterval(this.gameState.queueInterval);
            this.gameState.queueInterval = null;
        }
    }
    
    startTimer() {
        this.gameState.timerInterval = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateUI();
            
            if (this.gameState.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    startHamsterGeneration() {
        this.gameState.queueInterval = setInterval(() => {
            if (this.gameState.queue.length < CONFIG.MAX_QUEUE && this.gameState.gameActive) {
                this.addHamsterToQueue();
            }
        }, CONFIG.HAMSTER_SPAWN_INTERVAL);
    }
    
    addHamsterToQueue() {
        if (!this.gameState.gameActive) return;
        
        const hamsterType = this.hamsterTypes[Math.floor(Math.random() * this.hamsterTypes.length)];
        const name = CONFIG.HAMSTER_NAMES[Math.floor(Math.random() * CONFIG.HAMSTER_NAMES.length)];
        const id = Date.now();
        
        this.gameState.queue.push({
            id,
            name,
            color: hamsterType.color,
            type: hamsterType.type,
            typeName: hamsterType.name
        });
        
        this.updateQueueUI();
    }
    
    updateUI() {
        if (this.timerElement) {
            this.timerElement.textContent = this.gameState.timeLeft;
        }
        
        if (this.coinsElement) {
            this.coinsElement.textContent = this.gameState.coins;
        }
        
        for (let i = 1; i <= 6; i++) {
            const roomElement = document.querySelector(`.room[data-room-id="${i}"]`);
            if (!roomElement) continue;
            
            const room = this.gameState.rooms[i];
            
            if (!room) {
                this.gameState.rooms[i] = {
                    id: i,
                    occupied: false,
                    hamster: null,
                    unlocked: i <= this.gameState.unlockedRooms
                };
                continue;
            }
            
            const statusElement = roomElement.querySelector('.room-status');
            const hamsterElement = roomElement.querySelector('.room-hamster');
            const readyElement = roomElement.querySelector('.room-ready');
            const priceElement = roomElement.querySelector('.room-price');
            
            if (room && room.unlocked) {
                roomElement.classList.remove('locked');
                roomElement.classList.add('unlocked');
                
                if (room.occupied) {
                    roomElement.classList.add('occupied');
                    roomElement.classList.remove('unlocked');
                    if (statusElement) {
                        statusElement.textContent = 'Занят';
                        statusElement.style.background = '#e74c3c';
                    }
                    
                    // Отображаем хомячка в комнате
                    if (hamsterElement) {
                        const hamster = room.hamster;
                        hamsterElement.innerHTML = `
                            <div class="hamster-in-room ${hamster.type}">
                                <div class="hamster-body"></div>
                                <div class="hamster-head"></div>
                                <div class="hamster-ear left"></div>
                                <div class="hamster-ear right"></div>
                                <div class="hamster-eye left"></div>
                                <div class="hamster-eye right"></div>
                                <div class="hamster-nose"></div>
                                <div class="hamster-cheek left"></div>
                                <div class="hamster-cheek right"></div>
                                <div class="hamster-paw front left"></div>
                                <div class="hamster-paw front right"></div>
                                <div class="hamster-paw back left"></div>
                                <div class="hamster-paw back right"></div>
                                <div class="hamster-tail"></div>
                                <div class="hamster-name-small">${hamster.name}</div>
                            </div>
                        `;
                    }
                    
                    if (readyElement) {
                        readyElement.textContent = 'Занято';
                        readyElement.style.background = '#e74c3c';
                    }
                } else {
                    roomElement.classList.remove('occupied');
                    if (statusElement) {
                        statusElement.textContent = 'Свободен';
                        statusElement.style.background = '#27ae60';
                    }
                    if (hamsterElement) {
                        hamsterElement.innerHTML = '';
                    }
                    if (readyElement) {
                        readyElement.textContent = '✓ Готов';
                        readyElement.style.background = '#27ae60';
                    }
                }
                
                if (priceElement && i > this.gameState.unlockedRooms) {
                    priceElement.textContent = `${CONFIG.ROOM_PRICES[i]} монет`;
                } else if (priceElement) {
                    priceElement.remove();
                }
            } else {
                roomElement.classList.add('locked');
                roomElement.classList.remove('unlocked', 'occupied');
                if (statusElement) {
                    statusElement.textContent = 'Заблокирован';
                    statusElement.style.background = '#95a5a6';
                }
                if (hamsterElement) {
                    hamsterElement.innerHTML = '<div class="lock-icon">🔒</div>';
                }
                
                if (!priceElement && i > this.gameState.unlockedRooms) {
                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'room-price';
                    priceDiv.textContent = `${CONFIG.ROOM_PRICES[i]} монет`;
                    roomElement.appendChild(priceDiv);
                }
            }
        }
    }
    
    updateQueueUI() {
        if (!this.queueContainer) return;
        
        this.queueContainer.innerHTML = '';
        
        this.gameState.queue.forEach(hamster => {
            const hamsterElement = document.createElement('div');
            hamsterElement.className = `hamster hamster-animated pulse ${hamster.type}`;
            hamsterElement.dataset.hamsterId = hamster.id;
            hamsterElement.style.borderColor = hamster.color;
            hamsterElement.style.background = `linear-gradient(145deg, ${hamster.color}20, #ffffff)`;
            
            hamsterElement.innerHTML = `
                <div class="hamster-visual">
                    <div class="hamster-body"></div>
                    <div class="hamster-head"></div>
                    <div class="hamster-ear left"></div>
                    <div class="hamster-ear right"></div>
                    <div class="hamster-eye left"></div>
                    <div class="hamster-eye right"></div>
                    <div class="hamster-nose"></div>
                    <div class="hamster-cheek left"></div>
                    <div class="hamster-cheek right"></div>
                    <div class="hamster-paw front left"></div>
                    <div class="hamster-paw front right"></div>
                    <div class="hamster-paw back left"></div>
                    <div class="hamster-paw back right"></div>
                    <div class="hamster-tail"></div>
                </div>
                <div class="hamster-name" style="color: ${hamster.color}">${hamster.name}</div>
                <div class="hamster-wants">Хочет номер!</div>
            `;
            
            this.queueContainer.appendChild(hamsterElement);
        });
    }
    
    handleRoomClick(e) {
        if (!this.gameState.gameActive) return;
        
        const roomElement = e.target.closest('.room');
        if (!roomElement) return;
        
        const roomId = parseInt(roomElement.dataset.roomId);
        
        if (roomId > this.gameState.unlockedRooms) {
            this.unlockRoom(roomId);
            return;
        }
        
        const room = this.gameState.rooms[roomId];
        if (!room.occupied && this.gameState.queue.length > 0) {
            this.placeHamsterInRoom(roomId);
        }
    }
    
    handleHamsterClick(e) {
        if (!this.gameState.gameActive) return;
        
        const hamsterElement = e.target.closest('.hamster');
        if (!hamsterElement) return;
        
        const freeRoomId = this.findFreeRoom();
        if (freeRoomId) {
            const hamsterId = parseInt(hamsterElement.dataset.hamsterId);
            this.placeSpecificHamsterInRoom(hamsterId, freeRoomId);
        } else {
            hamsterElement.classList.add('shake');
            setTimeout(() => {
                hamsterElement.classList.remove('shake');
            }, 500);
        }
    }
    
    findFreeRoom() {
        for (let i = 1; i <= this.gameState.unlockedRooms; i++) {
            if (this.gameState.rooms[i] && !this.gameState.rooms[i].occupied) {
                return i;
            }
        }
        return null;
    }
    
    placeHamsterInRoom(roomId) {
        if (this.gameState.queue.length === 0) return;
        
        const hamster = this.gameState.queue.shift();
        this.placeHamster(hamster, roomId);
    }
    
    placeSpecificHamsterInRoom(hamsterId, roomId) {
        const hamsterIndex = this.gameState.queue.findIndex(h => h.id === hamsterId);
        if (hamsterIndex === -1) return;
        
        const hamster = this.gameState.queue.splice(hamsterIndex, 1)[0];
        this.placeHamster(hamster, roomId);
    }
    
    placeHamster(hamster, roomId) {
        if (!this.gameState.rooms[roomId]) {
            this.gameState.rooms[roomId] = {
                id: roomId,
                occupied: false,
                hamster: null,
                unlocked: roomId <= this.gameState.unlockedRooms
            };
        }
        
        this.gameState.rooms[roomId].occupied = true;
        this.gameState.rooms[roomId].hamster = hamster;
        
        this.updateUI();
        this.updateQueueUI();
        
        setTimeout(() => {
            if (this.gameState.gameActive && this.gameState.rooms[roomId] && this.gameState.rooms[roomId].occupied) {
                this.gameState.rooms[roomId].occupied = false;
                this.gameState.rooms[roomId].hamster = null;
                this.gameState.coins += CONFIG.HAMSTER_REWARD;
                this.gameState.servedHamsters++;
                
                this.updateUI();
                this.showCoinAnimation(roomId, CONFIG.HAMSTER_REWARD);
            }
        }, CONFIG.SERVICE_TIME * 1000);
    }
    
    showCoinAnimation(roomId, amount) {
        const roomElement = document.querySelector(`.room[data-room-id="${roomId}"]`);
        if (!roomElement) return;
        
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        coin.innerHTML = `+${amount} <i class="fas fa-coins"></i>`;
        coin.style.cssText = `
            position: absolute;
            color: #FFD700;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 100;
            animation: floatUp 1.5s ease-out;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;
        
        roomElement.appendChild(coin);
        
        setTimeout(() => {
            if (coin.parentNode) {
                coin.parentNode.removeChild(coin);
            }
        }, 1500);
    }
    
    unlockRoom(roomId) {
        const price = CONFIG.ROOM_PRICES[roomId];
        
        if (this.gameState.coins >= price) {
            this.gameState.coins -= price;
            this.gameState.unlockedRooms = roomId;
            this.gameState.rooms[roomId].unlocked = true;
            
            this.updateUI();
            
            const roomElement = document.querySelector(`.room[data-room-id="${roomId}"]`);
            if (roomElement) {
                roomElement.classList.add('pulse');
                setTimeout(() => {
                    roomElement.classList.remove('pulse');
                }, 1000);
                
                // Анимация разблокировки
                const unlockEffect = document.createElement('div');
                unlockEffect.className = 'unlock-effect';
                unlockEffect.innerHTML = '🔓 Открыто!';
                unlockEffect.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(46, 204, 113, 0.9);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: bold;
                    z-index: 100;
                    animation: fadeInOut 1.5s ease;
                `;
                roomElement.appendChild(unlockEffect);
                
                setTimeout(() => {
                    if (unlockEffect.parentNode) {
                        unlockEffect.parentNode.removeChild(unlockEffect);
                    }
                }, 1500);
            }
        } else {
            const roomElement = document.querySelector(`.room[data-room-id="${roomId}"]`);
            if (roomElement) {
                roomElement.classList.add('shake');
                setTimeout(() => {
                    roomElement.classList.remove('shake');
                }, 500);
            }
        }
    }
    
    endGame() {
        this.stopGame();
        
        if (this.finalCoinsElement) {
            this.finalCoinsElement.textContent = this.gameState.coins;
        }
        
        if (this.finalHamstersElement) {
            this.finalHamstersElement.textContent = this.gameState.servedHamsters;
        }
        
        if (this.finalRoomsElement) {
            this.finalRoomsElement.textContent = this.gameState.unlockedRooms;
        }
        
        let message = "";
        if (this.gameState.coins >= 100) {
            message = "Потрясающе! Вы мастер отельного бизнеса! 🏆";
        } else if (this.gameState.coins >= 50) {
            message = "Отличный результат! Отель процветает! ⭐";
        } else if (this.gameState.coins >= 20) {
            message = "Хорошая работа! Хомячки довольны! 😊";
        } else {
            message = "Неплохо! В следующий раз будет лучше! 🐹";
        }
        
        if (this.resultMessageElement) {
            this.resultMessageElement.textContent = message;
        }
        
        this.showScreen('resultScreen');
        this.sendGameResult();
    }
    
    sendGameResult() {
        const gameResult = {
            coins: this.gameState.coins,
            hamsters: this.gameState.servedHamsters,
            rooms: this.gameState.unlockedRooms,
            totalScore: this.gameState.coins + (this.gameState.servedHamsters * 5) + (this.gameState.unlockedRooms * 10)
        };
        
        if (this.api && this.api.sendGameResult) {
            this.api.sendGameResult(gameResult);
            
            if (this.api.isInTelegram && this.api.isInTelegram()) {
                this.api.showMainButton('Играть снова');
            }
        }
    }
    
    // Метод для получения случайного хомячка (для отладки)
    getRandomHamster() {
        const hamsterType = this.hamsterTypes[Math.floor(Math.random() * this.hamsterTypes.length)];
        const name = CONFIG.HAMSTER_NAMES[Math.floor(Math.random() * CONFIG.HAMSTER_NAMES.length)];
        
        return {
            id: Date.now(),
            name,
            color: hamsterType.color,
            type: hamsterType.type,
            typeName: hamsterType.name
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new HamsterHotelGame();
    window.game.init();
});

// Добавим анимации в глобальную область видимости
window.addEventListener('load', () => {
    // Создаем стили для анимаций если их нет
    if (!document.querySelector('#game-animations')) {
        const style = document.createElement('style');
        style.id = 'game-animations';
        style.textContent = `
            @keyframes floatUp {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 0; transform: scale(1); }
            }
            
            @keyframes hamsterSleep {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(0.95); }
            }
        `;
        document.head.appendChild(style);
    }
});