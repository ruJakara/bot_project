const CONFIG = {
    START_BALANCE: 5000,
    WIN_CHANCE: 50,  // ТЕПЕРЬ 50% НА ВЫИГРЫШ!
    LOSE_CHANCE: 50, // 50% НА ПРОИГРЫШ
    GAMES: {
        ROULETTE: 'roulette',
        DICE: 'dice',
        COIN: 'coin'
    },
    COLORS: {
        RED: 'red',
        BLACK: 'black'
    },
    COIN: {
        HEADS: 'heads',
        TAILS: 'tails'
    },
    SOUNDS: {
        WIN: 523.25,
        LOSE: 246.94,
        BET: 329.63,
        SPIN: 440
    }
};

let GameState = {
    balance: CONFIG.START_BALANCE,
    currentGame: CONFIG.GAMES.ROULETTE,
    isAnimating: false
};

function validateBet(betAmount) {
    betAmount = parseInt(betAmount);
    if (isNaN(betAmount) || betAmount <= 0) {
        return { valid: false, message: '❗ Ставка должна быть положительным числом' };
    }
    if (betAmount > GameState.balance) {
        return { valid: false, message: '❗ Недостаточно средств на счету' };
    }
    return { valid: true, amount: betAmount };
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playTone(frequency, type = 'sine', duration = 0.2) {
    try {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}