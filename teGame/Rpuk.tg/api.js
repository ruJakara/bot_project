const API = {
    sendResult: (result) => {
        console.log('Отправка финального результата:', result);
        
        if (window.Telegram && Telegram.WebApp) {
            // Форматируем данные для отправки
            const sendData = {
                score: result.totalScore,
                levels_completed: result.levelsCompleted,
                pairs_found: result.totalPairs,
                time_spent: result.totalTime,
                penalties_total: result.totalPenalties,
                efficiency: Math.round((result.totalPairs / (result.totalPairs + result.totalPenalties)) * 100)
            };
            
            Telegram.WebApp.sendData(JSON.stringify(sendData));
            
            // Показываем красивое уведомление
            Telegram.WebApp.showAlert(
                `Игра завершена!\n` +
                `🏆 Счёт: ${result.totalScore}\n` +
                `✅ Пар найдено: ${result.totalPairs}\n` +
                `⏱️ Времени потрачено: ${result.totalTime}с\n` +
                `⚠️ Штрафов: ${result.totalPenalties}`,
                () => {
                    setTimeout(() => {
                        if (Telegram.WebApp.close) {
                            Telegram.WebApp.close();
                        }
                    }, 1500);
                }
            );
        } else {
            // Демо-режим для тестирования в браузере
            const efficiency = Math.round((result.totalPairs / (result.totalPairs + result.totalPenalties)) * 100);
            const resultText = `
⚔️=== Результаты Игры ===⚔️
🎖️ Общий счёт: ${result.totalScore}
🔥 Пар найдено: ${result.totalPairs}
⏱️ Общее время: ${result.totalTime}с
⛔ Штрафов получено: ${result.totalPenalties}
🎯 Эффективность: ${efficiency}%

🏆 Пройдено уровней: ${result.levelsCompleted} из ${GAME_CONFIG.TOTAL_LEVELS}

📜 Детали по уровням:
${result.levelDetails.map(level => 
    `🔹 ${level.levelName}:\n` +
    `   • Счёт: ${level.score}\n` +
    `   • Пар: ${Object.values(level.pairsByType).reduce((a,b) => a+b, 0)}\n` +
    `   • Штрафы: ${level.penalties}\n` +
    `   • Статус: ${level.completed ? '✅ Успешно' : '❌ Не пройден'}`
).join('\n\n')}
`;
            alert('Тестовый режим (результаты в консоли):\n' + resultText);
            console.log('Демо-результаты:', result);
        }
    }
};