// Универсальный обработчик ввода

class InputManager {
    constructor() {
        this.clickHandlers = [];
        this.touchStartHandlers = [];
        this.touchEndHandlers = [];
        this.touchMoveHandlers = [];
        this.keyDownHandlers = [];
        
        this.touches = new Map(); // для мультитача
        this.preventScroll = true;
        
        this.init();
    }
    
    // Инициализация обработчиков
    init() {
        // Клик (мышь)
        document.addEventListener('click', (e) => {
            this.clickHandlers.forEach(handler => handler(e));
        });
        
        // Тач начало
        document.addEventListener('touchstart', (e) => {
            if (this.preventScroll) {
                e.preventDefault();
            }
            
            Array.from(e.changedTouches).forEach(touch => {
                this.touches.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY,
                    startTime: Date.now()
                });
            });
            
            this.touchStartHandlers.forEach(handler => handler(e));
        }, { passive: false });
        
        // Тач конец
        document.addEventListener('touchend', (e) => {
            Array.from(e.changedTouches).forEach(touch => {
                const touchData = this.touches.get(touch.identifier);
                if (touchData) {
                    const duration = Date.now() - touchData.startTime;
                    
                    // Эмулируем клик при коротком тапе
                    if (duration < 300) {
                        this.clickHandlers.forEach(handler => {
                            const fakeEvent = {
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                target: e.target
                            };
                            handler(fakeEvent);
                        });
                    }
                    
                    this.touches.delete(touch.identifier);
                }
            });
            
            this.touchEndHandlers.forEach(handler => handler(e));
        }, { passive: true });
        
        // Тач движение
        document.addEventListener('touchmove', (e) => {
            if (this.preventScroll) {
                e.preventDefault();
            }
            
            this.touchMoveHandlers.forEach(handler => handler(e));
        }, { passive: false });
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keyDownHandlers.forEach(handler => handler(e));
        });
    }
    
    // Добавление обработчика клика
    onClick(handler) {
        this.clickHandlers.push(handler);
    }
    
    // Добавление обработчика начала тача
    onTouchStart(handler) {
        this.touchStartHandlers.push(handler);
    }
    
    // Добавление обработчика конца тача
    onTouchEnd(handler) {
        this.touchEndHandlers.push(handler);
    }
    
    // Добавление обработчика движения тача
    onTouchMove(handler) {
        this.touchMoveHandlers.push(handler);
    }
    
    // Добавление обработчика нажатия клавиши
    onKeyDown(handler) {
        this.keyDownHandlers.push(handler);
    }
    
    // Удаление обработчика клика
    removeClickHandler(handler) {
        this.clickHandlers = this.clickHandlers.filter(h => h !== handler);
    }
    
    // Получение активных тачей
    getActiveTouches() {
        return this.touches;
    }
    
    // Отключение предотвращения скролла
    allowScroll() {
        this.preventScroll = false;
    }
    
    // Включение предотвращения скролла
    preventScrolling() {
        this.preventScroll = true;
    }
}

// Экземпляр менеджера ввода
const input = new InputManager();