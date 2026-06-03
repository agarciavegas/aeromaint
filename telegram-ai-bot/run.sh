#!/bin/bash
cd /home/z/my-project/telegram-ai-bot
while true; do
  echo "[$(date)] Iniciando bot..." >> bot.log
  bun run src/index.js >> bot.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Bot salio con codigo $EXIT_CODE. Reiniciando en 5s..." >> bot.log
  sleep 5
done
