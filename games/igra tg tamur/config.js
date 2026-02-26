const GAME_CONFIG = {
    clickPower: 1,
    rebirthThreshold: 100_000_000_000, // 100 миллиардов
    rebirthMultiplier: 2,
    shopItems: []
};

// 100 уникальных предметов
const names = [
    "Деревянная ложка", "Каменная рука", "Железный кулак", "Перчатка героя", "Молот Тора",
    "Рука робота", "Когти волка", "Перчатка Халка", "Перчатка Таноса", "Квантовая перчатка"
];
const emojis = ["🥄", "🪨", "🔨", "🧤", "🔱", "🤖", "🐺", "💚", "✋", "⚛️"];

for (let i = 0; i < 100; i++) {
    const power = Math.pow(1.5, i / 10);
    GAME_CONFIG.shopItems.push({
        name: names[i % names.length] + (i >= 10 ? ` Mk${Math.floor(i/10)}` : ""),
        emoji: emojis[i % emojis.length],
        baseCost: Math.floor(10 * Math.pow(1.4, i)),
        multiplier: Math.floor(0.1 * Math.pow(1.4, i)),
        owned: 0
    });
}
