#!/bin/bash
# ZBot - Telegram Polling Service
TOKEN="8207150505:AAF2qZEAi8CAcHPHFc58lcJzOH4vwqMTsGQ"
CHAT_ID="1135426447"
BOT_DIR="/home/z/my-project/telegram-ai-bot"
LOG="$BOT_DIR/bot.log"
LAST_ID_FILE="$BOT_DIR/data/last_update_id"
LAST_ID=0

[ -f "$LAST_ID_FILE" ] && LAST_ID=$(cat "$LAST_ID_FILE")

echo "[$(date)] 🤖 ZBot polling iniciado" >> "$LOG"

# Delete webhook
curl -s "https://api.telegram.org/bot${TOKEN}/deleteWebhook?drop_pending_updates=true" > /dev/null

# Send online notification
curl -s "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=¡Hola! 👋 Soy ZBot, tu asistente IA 24/7. Escribe /start para comenzar" \
  -d "parse_mode=Markdown" > /dev/null 2>&1

while true; do
  # Short polling
  RESPONSE=$(curl -s --max-time 10 \
    "https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${LAST_ID}&timeout=0" 2>/dev/null)
  
  [ -z "$RESPONSE" ] && sleep 2 && continue
  
  # Parse with python (mas fiable que node para parsear JSON en bash)
  MESSAGES=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok') and data.get('result'):
        for u in data['result']:
            uid = u['update_id']
            print(f'ID:{uid}')
            if 'message' in u and 'text' in u['message']:
                if u['message']['chat']['id'] == $CHAT_ID:
                    text = u['message']['text'].replace('\n', ' ')
                    print(f'MSG:{uid}|{text}')
except: pass
" 2>/dev/null)
  
  [ -z "$MESSAGES" ] && sleep 2 && continue
  
  while IFS= read -r line; do
    if [[ "$line" == ID:* ]]; then
      NEW_ID=$(echo "$line" | cut -d: -f2)
      LAST_ID=$((NEW_ID + 1))
      echo "$LAST_ID" > "$LAST_ID_FILE"
    elif [[ "$line" == MSG:* ]]; then
      MSG_TEXT=$(echo "$line" | cut -d'|' -f2-)
      echo "[$(date)] 📩 $MSG_TEXT" >> "$LOG"
      
      # Typing indicator
      curl -s "https://api.telegram.org/bot${TOKEN}/sendChatAction" \
        -d "chat_id=${CHAT_ID}&action=typing" > /dev/null 2>&1
      
      # Process message
      RESPONSE_TEXT=$(cd "$BOT_DIR" && node scripts/process-message.js "$MSG_TEXT" 2>/dev/null)
      
      if [ -n "$RESPONSE_TEXT" ]; then
        # URL-encode and send
        ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read()))" <<< "$RESPONSE_TEXT")
        curl -s "https://api.telegram.org/bot${TOKEN}/sendMessage" \
          -d "chat_id=${CHAT_ID}" \
          -d "text=${ENCODED}" \
          -d "parse_mode=Markdown" > /dev/null 2>&1
        
        # Si falla Markdown, reintentar sin formato
        if [ $? -ne 0 ]; then
          curl -s "https://api.telegram.org/bot${TOKEN}/sendMessage" \
            -d "chat_id=${CHAT_ID}" \
            -d "text=${ENCODED}" > /dev/null 2>&1
        fi
        
        echo "[$(date)] ✅ Respondido" >> "$LOG"
      fi
    fi
  done <<< "$MESSAGES"
  
  sleep 2
done
