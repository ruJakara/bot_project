// Утилиты и хелперы

class Utils {
    // Случайное целое число в диапазоне [min, max]
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Случайное число с плавающей точкой [min, max)
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Ограничение значения в диапазоне
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Линейная интерполяция
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    // Выбор случайного элемента из массива
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // Перемешивание массива (Фишер-Йейтс)
    static shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    // Форматирование времени (секунды → "0:45")
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Процент с округлением
    static percentage(part, total) {
        if (total === 0) return 0;
        return Math.round((part / total) * 100);
    }
    
    // Проверка мобильного устройства
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Дебаунс
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}