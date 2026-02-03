function sendGameResult(data) {
  const result = {
    type: "GAME_RESULT",
    score: data.score,
    total: data.total,
    level: data.level,
    timestamp: Date.now()
  };
  
  const json = JSON.stringify(result);
  
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.sendData(json);
    console.log("Результат отправлен:", json);
  }
}