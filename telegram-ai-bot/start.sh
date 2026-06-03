#!/bin/bash
# ZBot Telegram AI Bot - Servicio persistente
cd /home/z/my-project/telegram-ai-bot
exec bun run src/bot.js >> /home/z/my-project/telegram-ai-bot/bot.log 2>&1
