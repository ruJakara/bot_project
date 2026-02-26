// Сущности игры

class GameEntities {
    constructor() {
        this.ball = null;
        this.goalkeeper = null;
        this.zones = {
            'top-left': null,
            'top-center': null,
            'top-right': null,
            'bottom-left': null,
            'bottom-center': null,
            'bottom-right': null
        };
        this.isInitialized = false;
    }
    
    // Инициализация сущностей
    init() {
        if (this.isInitialized) return;
        
        this.ball = document.getElementById('ball');
        this.goalkeeper = document.getElementById('goalkeeper');
        
        this.zones['top-left'] = document.getElementById('zone-top-left');
        this.zones['top-center'] = document.getElementById('zone-top-center');
        this.zones['top-right'] = document.getElementById('zone-top-right');
        this.zones['bottom-left'] = document.getElementById('zone-bottom-left');
        this.zones['bottom-center'] = document.getElementById('zone-bottom-center');
        this.zones['bottom-right'] = document.getElementById('zone-bottom-right');
        
        console.log('Entities loaded:', {
            ball: !!this.ball,
            goalkeeper: !!this.goalkeeper,
            zones: Object.fromEntries(
                Object.entries(this.zones).map(([key, el]) => [key, !!el])
            )
        });
        
        // Добавляем обработчики кликов по зонам
        Object.values(this.zones).forEach(zone => {
            if (zone) {
                zone.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const zoneName = zone.dataset.zone;
                    this.handleZoneClick(zoneName);
                });
                
                // Дополнительный обработчик через глобальный input
                input.onClick((e) => {
                    if (e.target === zone) {
                        const zoneName = zone.dataset.zone;
                        this.handleZoneClick(zoneName);
                    }
                });
            }
        });
        
        this.isInitialized = true;
        console.log('✅ Entities инициализированы');
    }
    
    // Обработка клика по зоне
    handleZoneClick(zone) {
        console.log('🎯 Удар по зоне:', zone);
        
        if (!gameState.isReady() || !gameState.isActive()) {
            console.log('❌ Игра не активна или мяч не готов');
            return;
        }
        
        // Визуальная обратная связь
        this.highlightZone(zone);
        
        // Обрабатываем удар
        gameRules.processShot(zone);
    }
    
    // Подсветка зоны
    highlightZone(zone) {
        const zoneElement = this.zones[zone];
        if (!zoneElement) return;
        
        // Добавляем временный класс подсветки
        zoneElement.style.backgroundColor = 'rgba(251, 191, 36, 0.4)';
        
        setTimeout(() => {
            zoneElement.style.backgroundColor = '';
        }, 200);
    }
    
    // Подсветка проходных зон перед ударом
    flashAllowedZones(allowedZones, duration = 250) {
        const className = 'allowed-temp';
        Object.entries(this.zones).forEach(([zoneKey, zoneEl]) => {
            if (!zoneEl) return;
            if (allowedZones.has(zoneKey)) {
                zoneEl.classList.add(className);
            } else {
                zoneEl.classList.remove(className);
            }
        });
        
        setTimeout(() => {
            Object.values(this.zones).forEach(zoneEl => {
                if (zoneEl) {
                    zoneEl.classList.remove(className);
                }
            });
        }, duration);
    }
    
    // Получение позиции мяча
    getBallPosition() {
        if (!this.ball) return { x: 0, y: 0 };
        
        const rect = this.ball.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    // Получение позиции вратаря
    getGoalkeeperPosition() {
        if (!this.goalkeeper) return { x: 0, y: 0 };
        
        const rect = this.goalkeeper.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    // Обновление состояния сущностей
    update() {
        // Здесь можно добавить логику обновления позиций и т.д.
    }
}

// Экземпляр сущностей
const entities = new GameEntities();
