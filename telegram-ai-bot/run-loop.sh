#!/bin/bash
cd /home/z/my-project/telegram-ai-bot
while true; do
  bash scripts/cron-check.sh 2>/dev/null
  sleep 3
done
