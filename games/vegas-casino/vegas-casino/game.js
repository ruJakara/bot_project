document.addEventListener('DOMContentLoaded', () => {
    const balanceEl = document.getElementById('balance');
    const resetBtn = document.getElementById('reset-game');
    const gameBtns = document.querySelectorAll('.game-btn');
    
    const rouletteGame = document.getElementById('roulette-game');
    const diceGame = document.getElementById('dice-game');
    const coinGame = document.getElementById('coin-game');
    
    const rouletteResult = document.getElementById('roulette-result');
    const diceResult = document.getElementById('dice-result');
    const coinResult = document.getElementById('coin-result');
    
    const rouletteWheel = document.getElementById('roulette-wheel');
    const coin = document.getElementById('coin');
    const dice1 = document.getElementById('dice-1');
    const dice2 = document.getElementById('dice-2');
    
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    
    function updateBalance(newBalance, isWin = false) {
        GameState.balance = newBalance;
        balanceEl.textContent = newBalance;
        
        if (isWin) {
            balanceEl.classList.add('win-animation');
            setTimeout(() => balanceEl.classList.remove('win-animation'), 500);
        }
    }
    
    function setButtonsDisabled(disabled) {
        document.querySelectorAll('.action-btn, .game-btn, .reset-btn').forEach(btn => {
            btn.disabled = disabled;
        });
        GameState.isAnimating = disabled;
    }
    
    function showMessage(text, element) {
        element.textContent = text.toUpperCase();
    }

    function updateDiceFace(dice, value) {
        const dots = dice.querySelectorAll('.dot');
        dots.forEach(dot => dot.style.display = 'none');
        
        const patterns = {
            1: [4],
            2: [0, 8],
            3: [0, 4, 8],
            4: [0, 2, 6, 8],
            5: [0, 2, 4, 6, 8],
            6: [0, 2, 3, 5, 6, 8]
        };
        
        patterns[value].forEach(index => {
            if (dots[index]) dots[index].style.display = 'block';
        });
    }// ==================== РУЛЕТКА ====================
document.querySelectorAll('[data-bet]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (GameState.isAnimating || GameState.balance <= 0) {
            showMessage('❌ ПОДОЖДИ ОКОНЧАНИЯ АНИМАЦИИ', rouletteResult);
            return;
        }
        
        const betColor = e.target.dataset.bet;
        const betInput = document.getElementById('bet-amount-roulette');
        const validation = validateBet(betInput.value);
        
        if (!validation.valid) {
            showMessage(validation.message, rouletteResult);
            return;
        }
        
        const betAmount = validation.amount;
        setButtonsDisabled(true);
        playTone(CONFIG.SOUNDS.SPIN, 'sawtooth', 0.3);
        
        const wheel = document.getElementById('roulette-wheel-real');
        const ball = document.getElementById('roulette-ball');
        
        wheel.style.transform = 'rotate(0deg)';
        ball.style.transform = 'rotate(0deg) translateX(135px) rotate(0deg)';
        
        wheel.classList.add('spinning');
        ball.classList.add('spinning');
        
        const randomNum = Math.floor(Math.random() * 37);
        const targetAngle = (randomNum * 9.73 + 90) % 360;
        
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        wheel.style.transform = `rotate(${targetAngle}deg)`;
        wheel.classList.remove('spinning');
        
        ball.classList.remove('spinning');
        ball.classList.add('slow-motion');
        ball.style.transform = `rotate(${targetAngle}deg) translateX(135px) rotate(-${targetAngle}deg)`;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        ball.classList.remove('slow-motion');
        
        const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const isRed = redNumbers.includes(randomNum);
        const isBlack = !isRed && randomNum !== 0;
        
        const playerGuessed = (betColor === 'red' && isRed) || (betColor === 'black' && isBlack);
        
        // 50% шанс на выигрыш
        const win = Math.random() < 0.5;
        
        // ВЫИГРЫШ только если угадал И выиграл по шансу
        const isWin = playerGuessed && win;
        
        let resultColor = '0';
        if (isRed) resultColor = '🔴';
        if (isBlack) resultColor = '⚫';
        
        if (isWin) {
            updateBalance(GameState.balance + betAmount, true);
            showMessage(`🎉 ВЫИГРАЛ! +${betAmount} ₿ (${randomNum} ${resultColor})`, rouletteResult);
            playTone(CONFIG.SOUNDS.WIN, 'sawtooth', 0.4);
        } else {
            updateBalance(GameState.balance - betAmount, false);
            showMessage(`💥 ПРОИГРАЛ! -${betAmount} ₿ (${randomNum} ${resultColor})`, rouletteResult);
            playTone(CONFIG.SOUNDS.LOSE, 'triangle', 0.5);
        }
        
        setButtonsDisabled(false);
    });
});

// ==================== КОСТИ ====================
document.getElementById('roll-dice').addEventListener('click', async () => {
    if (GameState.isAnimating || GameState.balance <= 0) {
        showMessage('❌ ПОДОЖДИ ОКОНЧАНИЯ АНИМАЦИИ', diceResult);
        return;
    }
    
    const betInput = document.getElementById('bet-amount-dice');
    const guessInput = document.getElementById('dice-guess');
    const guess = parseInt(guessInput.value);
    
    if (guess < 1 || guess > 6) {
        showMessage('❗ ВВЕДИ ЧИСЛО ОТ 1 ДО 6', diceResult);
        return;
    }
    
    const validation = validateBet(betInput.value);
    if (!validation.valid) {
        showMessage(validation.message, diceResult);
        return;
    }
    
    const betAmount = validation.amount;
    setButtonsDisabled(true);
    
    dice1.classList.add('rolling');
    dice2.classList.add('rolling');
    playTone(CONFIG.SOUNDS.SPIN, 'square', 0.3);
    
    const interval = setInterval(() => {
        const temp1 = Math.floor(Math.random() * 6) + 1;
        const temp2 = Math.floor(Math.random() * 6) + 1;
        updateDiceFace(dice1, temp1);
        updateDiceFace(dice2, temp2);
    }, 100);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    clearInterval(interval);
    dice1.classList.remove('rolling');
    dice2.classList.remove('rolling');
    
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const playerGuessed = (diceRoll === guess);
    
    // 50% шанс на выигрыш
    const win = Math.random() < 0.5;
    const isWin = playerGuessed && win;
    
    updateDiceFace(dice1, diceRoll);
    updateDiceFace(dice2, diceRoll);
    
    if (isWin) {
        updateBalance(GameState.balance + betAmount, true);
        showMessage(`🎉 ВЫИГРАЛ! +${betAmount} ₿ (ВЫПАЛО ${diceRoll})`, diceResult);
        playTone(CONFIG.SOUNDS.WIN, 'sawtooth', 0.4);
    } else {
        updateBalance(GameState.balance - betAmount, false);
        showMessage(`💥 ПРОИГРАЛ! -${betAmount} ₿ (ВЫПАЛО ${diceRoll})`, diceResult);
        playTone(CONFIG.SOUNDS.LOSE, 'triangle', 0.5);
    }
    
    setButtonsDisabled(false);
});

// ==================== МОНЕТКА ====================
document.querySelectorAll('[data-coin]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (GameState.isAnimating || GameState.balance <= 0) {
            showMessage('❌ ПОДОЖДИ ОКОНЧАНИЯ АНИМАЦИИ', coinResult);
            return;
        }
        
        const betChoice = e.target.dataset.coin;
        const betInput = document.getElementById('bet-amount-coin');
        const validation = validateBet(betInput.value);
        
        if (!validation.valid) {
            showMessage(validation.message, coinResult);
            return;
        }
        
        const betAmount = validation.amount;
        setButtonsDisabled(true);
        
        coin.classList.add('flipping');
        playTone(CONFIG.SOUNDS.SPIN, 'triangle', 0.2);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        coin.classList.remove('flipping');
        
        const coinFlip = Math.random() < 0.5 ? 'heads' : 'tails';
        const coinName = coinFlip === 'heads' ? 'ОРЁЛ' : 'РЕШКА';
        
        const playerGuessed = (betChoice === coinFlip);
        
        // 50% шанс на выигрыш
        const win = Math.random() < 0.5;
        const isWin = playerGuessed && win;
        
        coin.style.transform = coinFlip === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        
        if (isWin) {
            updateBalance(GameState.balance + betAmount, true);
            showMessage(`🎉 ВЫИГРАЛ! +${betAmount} ₿ (${coinName})`, coinResult);
            playTone(CONFIG.SOUNDS.WIN, 'sawtooth', 0.4);
        } else {
            updateBalance(GameState.balance - betAmount, false);
            showMessage(`💥 ПРОИГРАЛ! -${betAmount} ₿ (${coinName})`, coinResult);
            playTone(CONFIG.SOUNDS.LOSE, 'triangle', 0.5);
        }
        
        setButtonsDisabled(false);
    });
});
    
    // ==================== КОСТИ ====================
    document.getElementById('roll-dice').addEventListener('click', async () => {
        if (GameState.isAnimating || GameState.balance <= 0) {
            showMessage('❌ ПОДОЖДИ ОКОНЧАНИЯ АНИМАЦИИ', diceResult);
            return;
        }
        
        const betInput = document.getElementById('bet-amount-dice');
        const guessInput = document.getElementById('dice-guess');
        const guess = parseInt(guessInput.value);
        
        if (guess < 1 || guess > 6) {
            showMessage('❗ ВВЕДИ ЧИСЛО ОТ 1 ДО 6', diceResult);
            return;
        }
        
        const validation = validateBet(betInput.value);
        if (!validation.valid) {
            showMessage(validation.message, diceResult);
            return;
        }
        
        const betAmount = validation.amount;
        setButtonsDisabled(true);
        
        dice1.classList.add('rolling');
        dice2.classList.add('rolling');
        playTone(CONFIG.SOUNDS.SPIN, 'square', 0.3);
        
        const interval = setInterval(() => {
            const temp1 = Math.floor(Math.random() * 6) + 1;
            const temp2 = Math.floor(Math.random() * 6) + 1;
            updateDiceFace(dice1, temp1);
            updateDiceFace(dice2, temp2);
        }, 100);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        clearInterval(interval);
        dice1.classList.remove('rolling');
        dice2.classList.remove('rolling');
        
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        const playerGuessed = (diceRoll === guess);
        const winByChance = Math.random() * 100 < 40;
        const isWin = playerGuessed && winByChance;
        
        updateDiceFace(dice1, diceRoll);
        updateDiceFace(dice2, diceRoll);
        
        if (isWin) {
            updateBalance(GameState.balance + betAmount, true);
            showMessage(`🎉 ПОБЕДА! +${betAmount} ₿ (ВЫПАЛО ${diceRoll})`, diceResult);
            playTone(CONFIG.SOUNDS.WIN, 'sawtooth', 0.3);
        } else {
            updateBalance(GameState.balance - betAmount, false);
            if (!playerGuessed) {
                showMessage(`💔 НЕ УГАДАЛ! -${betAmount} ₿ (ВЫПАЛО ${diceRoll})`, diceResult);
            } else {
                showMessage(`💔 НЕ ПОВЕЗЛО! -${betAmount} ₿ (ВЫПАЛО ${diceRoll})`, diceResult);
            }
            playTone(CONFIG.SOUNDS.LOSE, 'triangle', 0.4);
        }
        
        setButtonsDisabled(false);
    });
    
    // ==================== МОНЕТКА ====================
    document.querySelectorAll('[data-coin]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (GameState.isAnimating || GameState.balance <= 0) {
                showMessage('❌ ПОДОЖДИ ОКОНЧАНИЯ АНИМАЦИИ', coinResult);
                return;
            }
            
            const betChoice = e.target.dataset.coin;
            const betInput = document.getElementById('bet-amount-coin');
            const validation = validateBet(betInput.value);
            
            if (!validation.valid) {
                showMessage(validation.message, coinResult);
                return;
            }
            
            const betAmount = validation.amount;
            setButtonsDisabled(true);
            
            coin.classList.add('flipping');
            playTone(CONFIG.SOUNDS.SPIN, 'triangle', 0.2);
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            coin.classList.remove('flipping');
            
            const coinFlip = Math.random() < 0.5 ? 'heads' : 'tails';
            const coinName = coinFlip === 'heads' ? 'ОРЁЛ' : 'РЕШКА';
            
            const playerGuessed = (betChoice === coinFlip);
            const winByChance = Math.random() * 100 < 40;
            const isWin = playerGuessed && winByChance;
            
            coin.style.transform = coinFlip === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)';
            
            if (isWin) {
                updateBalance(GameState.balance + betAmount, true);
                showMessage(`🎉 ПОБЕДА! +${betAmount} ₿ (${coinName})`, coinResult);
                playTone(CONFIG.SOUNDS.WIN, 'sawtooth', 0.3);
            } else {
                updateBalance(GameState.balance - betAmount, false);
                if (!playerGuessed) {
                    showMessage(`💔 НЕ УГАДАЛ! -${betAmount} ₿ (${coinName})`, coinResult);
                } else {
                    showMessage(`💔 НЕ ПОВЕЗЛО! -${betAmount} ₿ (${coinName})`, coinResult);
                }
                playTone(CONFIG.SOUNDS.LOSE, 'triangle', 0.4);
            }
            
            setButtonsDisabled(false);
        });
    });
    
    // ==================== ПЕРЕКЛЮЧЕНИЕ ИГР ====================
    gameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (GameState.isAnimating) return;
            
            gameBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const game = btn.dataset.game;
            GameState.currentGame = game;
            
            rouletteGame.classList.remove('active');
            diceGame.classList.remove('active');
            coinGame.classList.remove('active');
            
            if (game === 'roulette') rouletteGame.classList.add('active');
            if (game === 'dice') diceGame.classList.add('active');
            if (game === 'coin') coinGame.classList.add('active');
            
            rouletteWheel.style.transform = 'none';
            coin.style.transform = 'rotateY(0deg)';
        });
    });
    
    // ==================== СБРОС ====================
    resetBtn.addEventListener('click', () => {
        updateBalance(CONFIG.START_BALANCE, true);
        showMessage('⚡ НОВАЯ ИГРА! БАЛАНС: 5000 ⚡', rouletteResult);
        showMessage('⚡ НОВАЯ ИГРА! БАЛАНС: 5000 ⚡', diceResult);
        showMessage('⚡ НОВАЯ ИГРА! БАЛАНС: 5000 ⚡', coinResult);
        playTone(440, 'sine', 0.5);
        
        document.getElementById('bet-amount-roulette').value = 100;
        document.getElementById('bet-amount-dice').value = 100;
        document.getElementById('bet-amount-coin').value = 100;
        document.getElementById('dice-guess').value = 3;
        
        rouletteWheel.style.transform = 'none';
        coin.style.transform = 'rotateY(0deg)';
        updateDiceFace(dice1, 1);
        updateDiceFace(dice2, 1);
    });
    
    updateDiceFace(dice1, 1);
    updateDiceFace(dice2, 1);
    showMessage('⚡ ДОБРО ПОЖАЛОВАТЬ! ⚡', rouletteResult);
});