#!/bin/bash
# Supervisor para ZBot - Lo reinicia si se cae
LOG="/home/z/my-project/telegram-ai-bot/bot.log"
cd /home/z/my-project/telegram-ai-bot

echo "[$(date)] Supervisor iniciado" >> "$LOG"

while true; do
  echo "[$(date)] Iniciando ZBot..." >> "$LOG"
  bun run src/bot.js >> "$LOG" 2>&1
  EXIT=$?
  echo "[$(date)] ZBot salio (codigo $EXIT). Reiniciando en 3s..." >> "$LOG"
  sleep 3
done
