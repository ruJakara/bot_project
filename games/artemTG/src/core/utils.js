// Вспомогательные функции
const Utils = {
  // Ограничение значения в диапазоне
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  
  // Случайное целое число в диапазоне
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Случайное число с плавающей точкой
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  // Выбор случайного элемента из массива
  randChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  // Перемешивание массива (алгоритм Фишера-Йейтса)
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
  
  // Форматирование времени (секунды → "00:00")
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  // Форматирование числа с разделителями
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },
  
  // Линейная интерполяция
  lerp(start, end, t) {
    return start + (end - start) * t;
  },
  
  // Плавная интерполяция (сглаживание)
  smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
  
  // Глубокое копирование объекта
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // Проверка на мобильное устройство
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Проверка на сенсорный экран
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Дебаунс
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Тrottle
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Получение параметра из URL
  getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },
  
  // Установка CSS переменной
  setCSSVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  },
  
  // Анимация числа
  animateNumber(element, start, end, duration) {
    const startTimestamp = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  },
  
  // Плавное изменение ширины полосы
  animateBar(element, targetWidth, duration = 400) {
    const startWidth = parseFloat(element.style.width) || 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutQuad
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      
      const currentWidth = startWidth + (targetWidth - startWidth) * easedProgress;
      element.style.width = `${currentWidth}%`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
};