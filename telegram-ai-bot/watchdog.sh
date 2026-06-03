#!/bin/bash
BOT_DIR="/home/z/my-project/telegram-ai-bot"
PID_FILE="$BOT_DIR/data/bot.pid"
LOG="$BOT_DIR/bot.log"

# Limpiar webhook al inicio
TOKEN="8207150505:AAF2qZEAi8CAcHPHFc58lcJzOH4vwqMTsGQ"
curl -s "https://api.telegram.org/bot${TOKEN}/deleteWebhook?drop_pending_updates=true" > /dev/null
rm -f "$BOT_DIR/data/last_update_id"

echo "[$(date)] 🤖 Watchdog iniciado" >> "$LOG"

# Enviar mensaje de hola
curl -s "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=1135426447" \
  -d "text=¡Hola! 👋 Soy ZBot, tu asistente IA 24/7. Escribe /start para comenzar." \
  -d "parse_mode=Markdown" > /dev/null 2>&1

while true; do
  # Verificar si el bot esta corriendo
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ! kill -0 "$OLD_PID" 2>/dev/null; then
      echo "[$(date)] ⚠️ Bot muerto (PID $OLD_PID), reiniciando..." >> "$LOG"
    else
      # Bot vivo, esperar y re-verificar
      sleep 5
      continue
    fi
  fi
  
  # Arrancar el bot
  cd "$BOT_DIR"
  bash scripts/poll.sh >> "$LOG" 2>&1 &
  NEW_PID=$!
  echo "$NEW_PID" > "$PID_FILE"
  echo "[$(date)] ✅ Bot arrancado (PID $NEW_PID)" >> "$LOG"
  
  sleep 10
done
