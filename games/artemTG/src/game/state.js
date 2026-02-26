// Состояние игры
const GameState = {
  cash: 50,
  rep: 50,
  risk: 50,
  maxRisk: 50,
  eventIndex: 0,
  safeChoices: 0,
  helpedFriend: 0,
  enteredScam: false,
  events: [],
  
  init() {
    this.reset();
    console.log('🎮 Состояние инициализировано');
  },
  
  reset() {
    this.cash = CONFIG.RESOURCES.CASH.start;
    this.rep = CONFIG.RESOURCES.REP.start;
    this.risk = CONFIG.RESOURCES.RISK.start;
    this.maxRisk = this.risk;
    this.eventIndex = 0;
    this.safeChoices = 0;
    this.helpedFriend = 0;
    this.enteredScam = false;
    
    // Перемешать события
    this.events = Utils.shuffle([...CONFIG.EVENTS]);
  },
  
  // Применить выбор игрока
  applyChoice(choiceKey) {
    const currentEvent = this.events[this.eventIndex];
    const choice = currentEvent.choices[choiceKey];
    
    // Применить эффекты
    if (choice.effects.cash !== undefined) {
      this.cash = Utils.clamp(
        this.cash + choice.effects.cash,
        CONFIG.RESOURCES.CASH.min,
        CONFIG.RESOURCES.CASH.max
      );
    }
    
    if (choice.effects.rep !== undefined) {
      this.rep = Utils.clamp(
        this.rep + choice.effects.rep,
        CONFIG.RESOURCES.REP.min,
        CONFIG.RESOURCES.REP.max
      );
    }
    
    if (choice.effects.risk !== undefined) {
      this.risk = Utils.clamp(
        this.risk + choice.effects.risk,
        CONFIG.RESOURCES.RISK.min,
        CONFIG.RESOURCES.RISK.max
      );
      
      // Отслеживание максимального риска
      this.maxRisk = Math.max(this.maxRisk, this.risk);
    }
    
    // Статистика
    if (choice.safe) {
      this.safeChoices++;
    }
    
    if (currentEvent.id === 'friend_loan' && choiceKey === 'a') {
      this.helpedFriend++;
    }
    
    if (choice.scam) {
      this.enteredScam = true;
    }
    
    // Обновить UI
    if (window.Game?.ui) {
      GameUI.updateResources();
    }
    
    // Воспроизвести звук
    GameAudio.play('click');
  },
  
  // Следующее событие
  nextEvent() {
    this.eventIndex++;
    
    if (this.eventIndex >= CONFIG.EVENTS.length) {
      // Игра завершена
      if (window.Game) Game.end();
      return;
    }
    
    // Обновить счетчик событий
    document.getElementById('event-counter').textContent = `${this.eventIndex + 1}/${CONFIG.EVENTS.length}`;
    
    // Показать событие
    this.showEvent();
    
    // Звук события
    GameAudio.play('event');
  },
  
  // Показать текущее событие
  showEvent() {
    const event = this.events[this.eventIndex];
    
    document.getElementById('event-text').textContent = event.text;
    document.getElementById('choice-a-text').textContent = event.choices.a.text;
    document.getElementById('choice-b-text').textContent = event.choices.b.text;
  },
  
  // Получить концовку
  getEnding() {
    for (const ending of CONFIG.ENDINGS) {
      if (ending.condition(this)) {
        return ending;
      }
    }
    
    // Если ни одно условие не выполнено - стабильность по умолчанию
    return CONFIG.ENDINGS.find(e => e.id === 'stability');
  },
  
  // Получить достижения
  getAchievements() {
    const unlocked = [];
    
    for (const achievement of CONFIG.ACHIEVEMENTS) {
      if (achievement.condition(this)) {
        unlocked.push(achievement);
      }
    }
    
    return unlocked;
  },
  
  // Получить текущие значения
  getValues() {
    return {
      cash: this.cash,
      rep: this.rep,
      risk: this.risk,
      maxRisk: this.maxRisk,
      safeChoices: this.safeChoices,
      helpedFriend: this.helpedFriend,
      enteredScam: this.enteredScam
    };
  }
};