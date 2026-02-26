#!/bin/bash
set -e  # остановка при ошибке

# Список всех проектов (добавляй новые строки)
PROJECTS=("bot_project" "botfinder")

for PROJECT in "${PROJECTS[@]}"; do
  echo "🔄 Deploying $PROJECT..."

  cd "/opt/bots/$PROJECT" || { echo "❌ $PROJECT not found"; continue; }
  
  # Сохраняем локальные файлы перед git pull
  if [ -f "deploy.sh" ]; then cp deploy.sh deploy.sh.bak 2>/dev/null; fi
  if [ -f "*.service" ]; then cp *.service service.bak 2>/dev/null; fi
  
  # Игнорируем локальные изменения
  git checkout -- . 2>/dev/null || true
  git pull origin main || { echo "⚠️ Git pull failed for $PROJECT"; continue; }

  source venv/bin/activate
  pip install -r requirements.txt --quiet || echo "⚠️ Pip install failed for $PROJECT"

  # Имя сервиса = kiberone-<имя_проекта_с_дефисом>
  if [ "$PROJECT" == "bot_project" ]; then
    SERVICE_NAME="kiberone-bot.service"
  else
    SERVICE_NAME="kiberone-$(echo $PROJECT | sed 's/_/-/g').service"
  fi
  
  # Проверяем существует ли сервис
  if systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    systemctl restart $SERVICE_NAME
    echo "✅ $PROJECT deployed (service: $SERVICE_NAME)"
  else
    echo "⚠️ Service $SERVICE_NAME not found, skipping restart"
  fi
done

echo "🎉 All bots updated!"
