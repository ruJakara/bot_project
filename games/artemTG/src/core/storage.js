// Локальное хранилище (рекорды, настройки)
const Storage = {
  KEY_BEST_SCORE: 'finance_game_best_score',
  KEY_ACHIEVEMENTS: 'finance_game_achievements',
  KEY_SETTINGS: 'finance_game_settings',
  
  // Сохранить результат игры
  saveResult(data) {
    try {
      const bestScore = this.getBestScore();
      const newScore = data.cash;
      
      // Обновить лучший результат
      if (newScore > bestScore) {
        localStorage.setItem(this.KEY_BEST_SCORE, JSON.stringify({
          score: newScore,
          ending: data.ending,
          date: new Date().toISOString()
        }));
      }
      
      // Сохранить достижения
      const unlocked = this.getUnlockedAchievements();
      const newAchievements = data.achievements || [];
      
      newAchievements.forEach(achId => {
        if (!unlocked.includes(achId)) {
          unlocked.push(achId);
        }
      });
      
      localStorage.setItem(this.KEY_ACHIEVEMENTS, JSON.stringify({
        list: unlocked,
        count: unlocked.length
      }));
      
      console.log('💾 Результат сохранен');
    } catch (e) {
      console.error('❌ Ошибка сохранения:', e);
    }
  },
  
  // Получить лучший результат
  getBestScore() {
    try {
      const data = localStorage.getItem(this.KEY_BEST_SCORE);
      if (!data) return 0;
      
      const parsed = JSON.parse(data);
      return parsed.score || 0;
    } catch (e) {
      console.error('❌ Ошибка чтения рекорда:', e);
      return 0;
    }
  },
  
  // Получить сохраненные достижения
  getUnlockedAchievements() {
    try {
      const data = localStorage.getItem(this.KEY_ACHIEVEMENTS);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.list || [];
    } catch (e) {
      console.error('❌ Ошибка чтения достижений:', e);
      return [];
    }
  },
  
  // Проверить, разблокировано ли достижение
  hasAchievement(achId) {
    return this.getUnlockedAchievements().includes(achId);
  },
  
  // Сохранить настройки
  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('❌ Ошибка сохранения настроек:', e);
    }
  },
  
  // Получить настройки
  getSettings() {
    try {
      const data = localStorage.getItem(this.KEY_SETTINGS);
      if (!data) return { sound: true, haptic: true };
      
      return JSON.parse(data);
    } catch (e) {
      console.error('❌ Ошибка чтения настроек:', e);
      return { sound: true, haptic: true };
    }
  },
  
  // Очистить все данные
  clearAll() {
    localStorage.removeItem(this.KEY_BEST_SCORE);
    localStorage.removeItem(this.KEY_ACHIEVEMENTS);
    localStorage.removeItem(this.KEY_SETTINGS);
    console.log('🗑️ Данные очищены');
  },
  
  // Проверка поддержки localStorage
  isAvailable() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};