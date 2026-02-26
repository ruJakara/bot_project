// Обновление пользовательского интерфейса
const GameUI = {
  init() {
    console.log('🎨 UI инициализирован');
  },
  
  // Обновить отображение ресурсов
  updateResources() {
    const state = GameState;
    
    // Кэш
    const cashFill = document.getElementById('cash-fill');
    const cashValue = document.getElementById('cash-value');
    if (cashFill && cashValue) {
      cashFill.style.width = `${state.cash}%`;
      cashValue.textContent = state.cash;
      
      // Цвет в зависимости от значения
      if (state.cash > 70) {
        cashFill.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
      } else if (state.cash < 30) {
        cashFill.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.6)';
      }
    }
    
    // Репутация
    const repFill = document.getElementById('rep-fill');
    const repValue = document.getElementById('rep-value');
    if (repFill && repValue) {
      repFill.style.width = `${state.rep}%`;
      repValue.textContent = state.rep;
      
      if (state.rep > 70) {
        repFill.style.boxShadow = '0 0 20px rgba(65, 105, 225, 0.8)';
      } else if (state.rep < 30) {
        repFill.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.6)';
      }
    }
    
    // Риск
    const riskFill = document.getElementById('risk-fill');
    const riskValue = document.getElementById('risk-value');
    if (riskFill && riskValue) {
      riskFill.style.width = `${state.risk}%`;
      riskValue.textContent = state.risk;
      
      if (state.risk > 70) {
        riskFill.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
      } else if (state.risk > 50) {
        riskFill.style.boxShadow = '0 0 15px rgba(255, 100, 0, 0.7)';
      }
    }
  },
  
  // Показать результат игры
  showResult(ending, achievements) {
    const state = GameState;
    
    // Иконка концовки
    const endingIcon = document.getElementById('ending-icon');
    if (endingIcon) {
      endingIcon.textContent = ending.icon;
      endingIcon.style.color = this.getEndingColor(ending.id);
    }
    
    // Заголовок и описание
    const endingTitle = document.getElementById('ending-title');
    const endingDesc = document.getElementById('ending-desc');
    if (endingTitle && endingDesc) {
      endingTitle.textContent = ending.title;
      endingDesc.textContent = ending.desc;
    }
    
    // Финальные статы
    document.getElementById('final-cash').textContent = state.cash;
    document.getElementById('final-rep').textContent = state.rep;
    document.getElementById('final-risk').textContent = state.risk;
    
    // Достижения
    this.showAchievements(achievements);
    
    // Звук в зависимости от концовки
    if (ending.id === 'liquidation' || ending.id === 'grey') {
      GameAudio.play('lose');
    } else {
      GameAudio.play('win');
    }
  },
  
  // Показать достижения
  showAchievements(achievements) {
    const list = document.getElementById('achievements-list');
    if (!list) return;
    
    if (achievements.length === 0) {
      list.innerHTML = '<div class="achievement-item" style="justify-content:center;color:rgba(255,255,255,0.6)">Нет достижений</div>';
      return;
    }
    
    list.innerHTML = achievements.map(ach => `
      <div class="achievement-item">
        <span class="achievement-icon">${ach.icon}</span>
        <div>
          <div style="font-weight:600">${ach.name}</div>
          <div style="font-size:0.9rem;color:rgba(255,255,255,0.7)">${ach.desc}</div>
        </div>
      </div>
    `).join('');
  },
  
  // Обновить лучший результат
  updateBestScore() {
    const bestScore = Storage.getBestScore();
    const element = document.getElementById('best-score');
    if (element) {
      element.textContent = bestScore > 0 ? bestScore : '—';
    }
  },
  
  // Получить цвет для концовки
  getEndingColor(endingId) {
    const colors = {
      liquidation: '#ff4444',
      stability: '#4169e1',
      legend: '#ffd700',
      luck: '#00ff00',
      grey: '#808080',
      honor: '#ff69b4'
    };
    return colors[endingId] || '#ffffff';
  },
  
  // Показать уведомление
  showNotification(message, type = 'info') {
    // Создать временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 30, 50, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
      animation: slideDown 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    `;
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  },
  
  // Скрыть все уведомления
  clearNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  }
};