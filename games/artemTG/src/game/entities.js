// Сущности игры (опционально, для будущего расширения)
const GameEntities = {
  init() {
    console.log('🎯 Сущности инициализированы');
  },
  
  // Создать событие
  createEvent(data) {
    return {
      id: data.id,
      text: data.text,
      choices: {
        a: { ...data.choices.a },
        b: { ...data.choices.b }
      },
      timestamp: Date.now()
    };
  },
  
  // Создать игрока
  createPlayer() {
    return {
      cash: CONFIG.RESOURCES.CASH.start,
      rep: CONFIG.RESOURCES.REP.start,
      risk: CONFIG.RESOURCES.RISK.start,
      achievements: [],
      history: []
    };
  },
  
  // Создать достижение
  createAchievement(data) {
    return {
      id: data.id,
      icon: data.icon,
      name: data.name,
      desc: data.desc,
      unlocked: false,
      unlockedAt: null
    };
  },
  
  // Создать статистику
  createStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalCashEarned: 0,
      totalRiskTaken: 0,
      safeChoices: 0,
      riskyChoices: 0
    };
  },
  
  // Обновить статистику
  updateStats(stats, gameState) {
    stats.gamesPlayed++;
    
    const ending = GameRules.getEnding(gameState);
    if (ending.id !== 'liquidation') {
      stats.gamesWon++;
    }
    
    stats.totalCashEarned += gameState.cash;
    stats.totalRiskTaken += gameState.risk;
    
    return stats;
  }
};