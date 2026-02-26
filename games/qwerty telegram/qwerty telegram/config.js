// Константы игры
const GAME_CONFIG = {
    // Таймер
    DURATION: 45, // секунд
    TIMER_WARNING: 10, // секунд до предупреждения
    
    // Очки
    POINTS_PER_GOAL: 1,
    
    // Вратарь
    GOALKEEPER_JUMP_DELAY: 300, // мс задержка перед прыжком
    GOALKEEPER_JUMP_DURATION: 400, // мс длительность прыжка
    GOALKEEPER_RESET_DELAY: 800, // мс задержка перед возвратом
    
    // Мяч
    BALL_SHOOT_DURATION: 600, // мс анимация удара
    BALL_RESET_DELAY: 1000, // мс задержка перед сбросом мяча
    
    // Зоны ворот
    ZONES: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
    
    // Статистика
    MAX_RECENT_SHOTS: 10, // сколько последних ударов учитывать для ИИ
};
