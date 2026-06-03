#!/bin/bash
while true; do
  bash /home/z/my-project/telegram-ai-bot/scripts/poll.sh
  echo "[$(date)] Bot se cayo, reiniciando en 5s..." >> /home/z/my-project/telegram-ai-bot/bot.log
  sleep 5
done
