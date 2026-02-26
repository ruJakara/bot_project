# Деплой бота на VPS (AdminVPS)

## Первичная настройка

### 1. Подключение к серверу
```bash
ssh root@89.191.225.207
```

### 2. Установка зависимостей
```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git
```

### 3. Клонирование проекта
```bash
mkdir -p /opt/bots
cd /opt/bots
git clone <YOUR_REPO_URL> bot_project
cd bot_project
```

### 4. Создание виртуального окружения
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5. Настройка переменных окружения
```bash
cp .env.example .env
nano .env
```
Отредактируйте `.env` под ваши значения (токен бота, админ ID и т.д.)

### 6. Настройка systemd
```bash
cp kiberone-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable kiberone-bot
systemctl start kiberone-bot
systemctl status kiberone-bot
```

### 7. Настройка скрипта деплоя
```bash
chmod +x deploy.sh
```

---

## Обновление бота

После внесения изменений в код локально:

```bash
# Локально
git add .
git commit -m "Описание изменений"
git push

# На сервере
cd /opt/bots/bot_project
./deploy.sh
```

---

## Полезные команды

```bash
# Проверка статуса
systemctl status kiberone-bot

# Просмотр логов
journalctl -u kiberone-bot -f

# Перезапуск
systemctl restart kiberone-bot

# Остановка
systemctl stop kiberone-bot

# Запуск
systemctl start kiberone-bot
```

---

## Доступ к играм

После деплоя игры доступны по адресу:
```
http://89.191.225.207:10000/games/
```

Вебхук для Telegram:
```
http://89.191.225.207:10000/
```
