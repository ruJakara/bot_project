// Локальное хранилище (рекорды)

class StorageManager {
    constructor() {
        this.storageKey = 'penalty_game_data';
        this.data = this.load();
    }
    
    // Загрузка данных из localStorage
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            console.error('Failed to load storage:', e);
            return this.getDefaultData();
        }
    }
    
    // Получение данных по умолчанию
    getDefaultData() {
        return {
            bestScore: 0,
            totalGoals: 0,
            totalAttempts: 0,
            lastPlayed: null
        };
    }
    
    // Сохранение данных в localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save storage:', e);
        }
    }
    
    // Получение лучшего счёта
    getBestScore() {
        return this.data.bestScore || 0;
    }
    
    // Обновление лучшего счёта
    updateBestScore(score) {
        if (score > this.data.bestScore) {
            this.data.bestScore = score;
            this.data.lastPlayed = new Date().toISOString();
            this.save();
            return true; // новый рекорд
        }
        return false;
    }
    
    // Обновление статистики
    updateStats(goals, attempts) {
        this.data.totalGoals += goals;
        this.data.totalAttempts += attempts;
        this.save();
    }
    
    // Получение всей статистики
    getStats() {
        return { ...this.data };
    }
    
    // Сброс данных
    reset() {
        this.data = this.getDefaultData();
        this.save();
    }
    
    // Проверка, есть ли сохранённые данные
    hasData() {
        return this.data.bestScore > 0 || this.data.totalGoals > 0;
    }
}

// Экземпляр менеджера хранилища
const storage = new StorageManager();