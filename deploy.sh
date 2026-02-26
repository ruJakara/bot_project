#!/bin/bash
cd /opt/bots/bot_project || exit 1

git pull
source venv/bin/activate
pip install -r requirements.txt

systemctl restart kiberone-bot
echo "Bot updated and restarted."
