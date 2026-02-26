// Правила игры и логика
const GameRules = {
  init() {
    console.log('📜 Правила инициализированы');
  },
  
  // Проверка валидности выбора
  isValidChoice(choice) {
    return choice === 'a' || choice === 'b';
  },
  
  // Автоматический выбор (если игрок не успел)
  autoChoice() {
    // Безопасный выбор по умолчанию
    return 'a';
  },
  
  // Расчет итогового результата
  calculateResult(state) {
    const ending = this.getEnding(state);
    const achievements = this.getAchievements(state);
    const score = state.cash; // Основной счет - кэш
    
    return {
      score,
      ending,
      achievements,
      stats: {
        cash: state.cash,
        rep: state.rep,
        risk: state.risk
      }
    };
  },
  
  // Определение концовки
  getEnding(state) {
    for (const ending of CONFIG.ENDINGS) {
      if (ending.condition(state)) {
        return ending;
      }
    }
    
    return CONFIG.ENDINGS[1]; // Стабильность по умолчанию
  },
  
  // Получение достижений
  getAchievements(state) {
    const unlocked = [];
    
    for (const achievement of CONFIG.ACHIEVEMENTS) {
      if (achievement.condition(state)) {
        unlocked.push(achievement);
      }
    }
    
    return unlocked;
  },
  
  // Проверка условий концовки в реальном времени
  checkEndingConditions(state) {
    return CONFIG.ENDINGS.filter(ending => ending.condition(state));
  },
  
  // Проверка достижений в реальном времени
  checkAchievements(state) {
    return CONFIG.ACHIEVEMENTS.filter(ach => ach.condition(state));
  },
  
  // Валидация ресурсов
  validateResources(state) {
    return {
      cash: Utils.clamp(state.cash, CONFIG.RESOURCES.CASH.min, CONFIG.RESOURCES.CASH.max),
      rep: Utils.clamp(state.rep, CONFIG.RESOURCES.REP.min, CONFIG.RESOURCES.REP.max),
      risk: Utils.clamp(state.risk, CONFIG.RESOURCES.RISK.min, CONFIG.RESOURCES.RISK.max)
    };
  },
  
  // Получить совет на основе текущего состояния
  getAdvice(state) {
    if (state.risk > 75) {
      return '⚠️ Риск слишком высок! Выберите безопасные варианты.';
    }
    
    if (state.rep < 30) {
      return '📉 Репутация падает! Подумайте о доверии.';
    }
    
    if (state.cash < 30) {
      return '💸 Кэш на низком уровне! Найдите источник дохода.';
    }
    
    if (state.cash > 70 && state.rep > 70) {
      return '✨ Отличный баланс! Продолжайте в том же духе.';
    }
    
    return '';
  }
};