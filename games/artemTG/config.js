const CONFIG = {
  RESOURCES: {
    CASH: { min: 0, max: 100, start: 50, color: '#ffd700' },
    REP: { min: 0, max: 100, start: 50, color: '#4169e1' },
    RISK: { min: 0, max: 100, start: 50, color: '#00ff00' }
  },
  
  GAME: {
    DURATION: 60,
    EVENTS_COUNT: 12,
    EVENT_DURATION: 5,
    CHOICE_TIMEOUT: 3
  },
  
  SCENES: {
    START: 'scene-start',
    GAME: 'scene-game',
    RESULT: 'scene-result'
  },
  
  ENDINGS: [
    { id: 'liquidation', icon: '💀', title: 'Ликвидация', desc: 'Волатильность убила', condition: s => s.risk >= 85 },
    { id: 'stability', icon: '🛡️', title: 'Стабильность', desc: 'Дисциплина победила', condition: s => s.risk <= 30 && s.cash >= 55 },
    { id: 'legend', icon: '👑', title: 'Легенда', desc: 'Социальный капитал', condition: s => s.rep >= 75 && s.cash >= 55 },
    { id: 'luck', icon: '🚀', title: 'Удача', desc: 'Поймал памп', condition: s => s.cash >= 75 },
    { id: 'grey', icon: '🦈', title: 'Серый путь', desc: 'Деньги без друзей', condition: s => s.cash >= 70 && s.rep <= 35 },
    { id: 'honor', icon: '❤️', title: 'Бедная честь', desc: 'Мораль дороже', condition: s => s.rep >= 75 && s.cash <= 35 }
  ],
  
  ACHIEVEMENTS: [
    // Основные достижения
    { id: 'cushion', icon: '🛡️', name: 'Подушка безопасности', desc: 'Никогда не поднимал риск выше 40', condition: s => s.maxRisk <= 40 },
    { id: 'reliable', icon: '⭐', name: 'Надёжный партнёр', desc: 'Репутация ≥ 80', condition: s => s.rep >= 80 },
    { id: 'chance', icon: '₿', name: 'Золотая жила', desc: 'Кэш ≥ 85', condition: s => s.cash >= 85 },
    { id: 'balance', icon: '⚖️', name: 'Идеальный баланс', desc: 'Все ресурсы в диапазоне 45-65', condition: s => s.cash >= 45 && s.cash <= 65 && s.rep >= 45 && s.rep <= 65 && s.risk >= 45 && s.risk <= 65 },
    { id: 'discipline', icon: '🦾', name: 'Дисциплина', desc: '5+ безопасных выборов', condition: s => s.safeChoices >= 5 },
    { id: 'survivor', icon: '🔥', name: 'Выживший', desc: 'Риск ≥ 70 и не ликвидирован', condition: s => s.risk >= 70 && s.risk < 85 },
    { id: 'generous', icon: '🤝', name: 'Щедрый', desc: 'Помог другу 3+ раза', condition: s => s.helpedFriend >= 3 },
    { id: 'shark', icon: '🦈', name: 'Акула', desc: 'Зашёл в скам', condition: s => s.enteredScam },
    
    // Новые достижения
    { id: 'banker', icon: '🏦', name: 'Банкир', desc: 'Кэш ≥ 90', condition: s => s.cash >= 90 },
    { id: 'saint', icon: '😇', name: 'Святой', desc: 'Репутация ≥ 95', condition: s => s.rep >= 95 },
    { id: 'gambler', icon: '🎲', name: 'Гемблер', desc: 'Риск ≥ 80', condition: s => s.risk >= 80 },
    { id: 'perfect', icon: '🎯', name: 'Перфекционист', desc: 'Все ресурсы ровно 50', condition: s => s.cash === 50 && s.rep === 50 && s.risk === 50 },
    { id: 'speed', icon: '⚡', name: 'Спидранер', desc: 'Завершил игру за 45 секунд', condition: s => s.fastGame },
    { id: 'hero', icon: '🦸', name: 'Герой', desc: 'Репутация ≥ 70 и Кэш ≥ 70', condition: s => s.rep >= 70 && s.cash >= 70 },
    { id: 'minimalist', icon: '🍃', name: 'Минималист', desc: 'Риск ≤ 20', condition: s => s.risk <= 20 },
    { id: 'risktaker', icon: '🎪', name: 'Рисковый', desc: '10+ рискованных выборов', condition: s => s.riskyChoices >= 10 },
    { id: 'helper', icon: '💝', name: 'Помощник', desc: 'Помог семье 2+ раза', condition: s => s.helpedFamily >= 2 },
    { id: 'taxman', icon: '🧾', name: 'Налоговый инспектор', desc: 'Всегда платил налоги честно', condition: s => s.alwaysHonest },
    { id: 'trader', icon: '📈', name: 'Трейдер', desc: '5+ сделок с рынком', condition: s => s.marketTrades >= 5 },
    { id: 'legendary', icon: '🌟', name: 'Легендарный', desc: 'Получил 8+ достижений за игру', condition: s => s.achievementsThisGame >= 8 },
    { id: 'collector', icon: '🏆', name: 'Коллекционер', desc: 'Разблокировал все достижения', condition: s => s.allAchievements },
    { id: 'pacifist', icon: '🕊️', name: 'Пацифист', desc: 'Ни разу не отказал в помощи', condition: s => s.neverRefused },
    { id: 'maxcash', icon: '💰', name: 'Максимум кэша', desc: 'Достиг 100 кэша', condition: s => s.cash === 100 },
    { id: 'maxrep', icon: '👑', name: 'Король репутации', desc: 'Достиг 100 репутации', condition: s => s.rep === 100 },
    { id: 'maxrisk', icon: '💥', name: 'На грани', desc: 'Достиг 100 риска', condition: s => s.risk === 100 },
    { id: 'firstblood', icon: '🥇', name: 'Первая кровь', desc: 'Первая игра пройдена', condition: s => s.firstGame },
    { id: 'veteran', icon: '🎖️', name: 'Ветеран', desc: 'Сыграл 10+ игр', condition: s => s.gamesPlayed >= 10 },
    { id: 'master', icon: '👑', name: 'Мастер', desc: 'Получил все 6 концовок', condition: s => s.allEndings },
    { id: 'lucky', icon: '🍀', name: 'Счастливчик', desc: 'Поймал удачу на рынке', condition: s => s.gotLucky },
    { id: 'cautious', icon: '🐢', name: 'Осторожный', desc: 'Ни разу не выбрал рискованный вариант', condition: s => s.riskyChoices === 0 },
    { id: 'bold', icon: '🦁', name: 'Смелый', desc: 'Все решения были рискованными', condition: s => s.riskyChoices === 12 },
    { id: 'balanced', icon: '☯️', name: 'Гармония', desc: 'Разница между всеми ресурсами ≤ 10', condition: s => Math.max(s.cash, s.rep, s.risk) - Math.min(s.cash, s.rep, s.risk) <= 10 },
    { id: 'comeback', icon: '🔄', name: 'Возвращение', desc: 'Восстановился после критического риска', condition: s => s.comeback },
    { id: 'investor', icon: '💼', name: 'Инвестор', desc: 'Вложил в 5+ выгодных сделок', condition: s => s.goodInvestments >= 5 },
    { id: 'networker', icon: '🌐', name: 'Сетевик', desc: 'Построил сильные связи', condition: s => s.networking >= 3 },
    { id: 'survivor2', icon: '🛡️', name: 'Невероятный выживший', desc: 'Риск ≥ 84 и не ликвидирован', condition: s => s.risk >= 84 && s.risk < 85 },
    { id: 'greedy', icon: '😈', name: 'Жадный', desc: 'Отказал 4+ раза в помощи', condition: s => s.refusedHelp >= 4 },
    { id: 'altruist', icon: '😇', name: 'Альтруист', desc: 'Пожертвовал 30+ кэша', condition: s => s.donated >= 30 }
  ],
  
  EVENTS: [
    { id: 'salary', text: 'Зарплата пришла', choices: { a: { text: '70% подушка безопасности', effects: { cash: +8, risk: -6, rep: +1 }, safe: true }, b: { text: '80% в риск-активы', effects: { cash: +14, risk: +10 }, safe: false } } },
    { id: 'friend_loan', text: 'Друг просит занять денег', choices: { a: { text: 'Дать в долг', effects: { cash: -6, rep: +8, risk: +2 }, safe: true }, b: { text: 'Вежлико отказать', effects: { rep: -6 }, safe: false } } },
    { id: 'market_dip', text: 'Курс упал на 8%', choices: { a: { text: 'Продать часть', effects: { cash: +6, risk: -8 }, safe: true }, b: { text: 'Докупить на падении', effects: { cash: +10, risk: +10 }, safe: false } } },
    { id: 'scam', text: '"Гарантировано 3%/день"', choices: { a: { text: 'Игнорировать скам', effects: { rep: +1, risk: -3 }, safe: true }, b: { text: 'Вложиться в схему', effects: { cash: +8, risk: +14, rep: -2 }, safe: false, scam: true } } },
    { id: 'taxes', text: 'Налоговая проверка', choices: { a: { text: 'Оплатить честно', effects: { cash: -10, rep: +5, risk: -5 }, safe: true, honest: true }, b: { text: 'Скрыть часть доходов', effects: { cash: +5, rep: -10, risk: +15 }, safe: false } } },
    { id: 'family', text: 'Семья просит финансовой помощи', choices: { a: { text: 'Помочь без вопросов', effects: { cash: -8, rep: +10, risk: -2 }, safe: true, family: true }, b: { text: 'Отложить на потом', effects: { rep: -5 }, safe: false } } },
    { id: 'pump_rumor', text: 'Слухи о скором пампе', choices: { a: { text: 'Ждать подтверждения', effects: { risk: -4, rep: +2 }, safe: true }, b: { text: 'Войти по слухам', effects: { cash: +12, risk: +12 }, safe: false } } },
    { id: 'emergency', text: 'Срочные непредвиденные расходы', choices: { a: { text: 'Использовать подушку', effects: { cash: -12, risk: -5, rep: +1 }, safe: true }, b: { text: 'Взять быстрый кредит', effects: { cash: +5, risk: +15, rep: -3 }, safe: false } } },
    { id: 'opportunity', text: 'Выгодная инвестиционная возможность', choices: { a: { text: 'Маленькая доля для пробы', effects: { cash: +5, rep: +3, risk: +2 }, safe: true }, b: { text: 'Всё вложить, максимум прибыли', effects: { cash: +20, risk: +20, rep: -5 }, safe: false } } },
    { id: 'reputation', text: 'Предложение о партнёрстве', choices: { a: { text: 'Согласиться на сотрудничество', effects: { rep: +10, cash: +3, risk: +2 }, safe: true }, b: { text: 'Поторговаться о выгоде', effects: { rep: -3, cash: +8 }, safe: false } } },
    { id: 'crisis', text: 'Глобальный рыночный кризис', choices: { a: { text: 'Сохранить капитал', effects: { risk: -10, rep: +5 }, safe: true }, b: { text: 'Шортить на панике', effects: { cash: +15, risk: +15, rep: -5 }, safe: false } } },
    { id: 'final_decision', text: 'Финальная судьбоносная сделка', choices: { a: { text: 'Консервативный подход', effects: { cash: +8, rep: +5, risk: -3 }, safe: true }, b: { text: 'Алл-ин, всё или ничего', effects: { cash: +25, risk: +25, rep: -10 }, safe: false } } }
  ]
};