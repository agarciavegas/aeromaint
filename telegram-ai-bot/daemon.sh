#!/bin/bash
cd /home/z/my-project/telegram-ai-bot
while true; do
  bash scripts/poll.sh 2>&1
  echo "[$(date)] Reiniciando en 3s..." >> bot.log
  sleep 3
done
