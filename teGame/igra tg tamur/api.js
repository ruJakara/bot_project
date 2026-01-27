async function sendToBot(coins, event) {
    try {
        const message = `🎮 КЛИКЕР ТИМУРА (14 ЛЕТ)\n\n` +
                       `💰 ${game.formatNumber(coins)} монет\n` +
                       `📦 Предметов: ${game.itemsOwned}/100\n` +
                       `🔄 ${event.toUpperCase()}\n\n` +
                       `👑 ТИМУР = ЛЕГЕНДА!`;
        
        await fetch('https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: 'YOUR_CHAT_ID',
                text: message
            })
        });
        console.log('✅ Отправлено!');
    } catch (e) {
        console.log('Сохранено локально');
    }
}
