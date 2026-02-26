#!/bin/bash
set -e  # остановка при ошибке

# Список всех проектов (добавляй новые строки)
PROJECTS=("bot_project" "botfinder")

for PROJECT in "${PROJECTS[@]}"; do
  echo "🔄 Deploying $PROJECT..."
  
  cd "/opt/bots/$PROJECT" || { echo "❌ $PROJECT not found"; continue; }
  git pull origin main || echo "⚠️ Git pull failed for $PROJECT"
  
  source venv/bin/activate
  pip install -r requirements.txt --quiet || echo "⚠️ Pip install failed for $PROJECT"
  
  # Имя сервиса = имя проекта с дефисом
  SERVICE_NAME=$(echo $PROJECT | sed 's/_/-/g').service
  systemctl restart $SERVICE_NAME
  
  echo "✅ $PROJECT deployed"
done

echo "🎉 All bots updated!"
