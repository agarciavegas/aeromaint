#!/bin/bash
# ============================================================
# Script de test - Verifica que todo funciona correctamente
# ============================================================

source .env 2>/dev/null || true

echo "🧪 Tests de verificacion"
echo "========================"
echo ""

# Test 1: n8n accesible
echo -n "1. n8n accesible... "
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ (no responde)"
fi

# Test 2: Telegram Bot
echo -n "2. Telegram Bot... "
BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" 2>/dev/null)
if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_NAME=$(echo "$BOT_INFO" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ (@$BOT_NAME)"
else
    echo "❌ (token invalido)"
fi

# Test 3: n8n API
echo -n "3. n8n API... "
if [ -n "$N8N_API_KEY" ]; then
    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:5678/api/v1/workflows" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" 2>/dev/null)
    if [ "$API_TEST" = "200" ]; then
        echo "✅"
    else
        echo "❌ (HTTP $API_TEST)"
    fi
else
    echo "⚠️ (sin API Key configurada)"
fi

# Test 4: OpenAI
echo -n "4. OpenAI API... "
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "sk-tu_openai_api_key_aqui" ]; then
    echo "✅ (configurada)"
else
    echo "⚠️ (no configurada - agente IA no funcionara)"
fi

# Test 5: Docker
echo -n "5. Docker... "
if docker ps > /dev/null 2>&1; then
    N8N_CONTAINER=$(docker ps --filter "name=n8n" --format "{{.Names}}" 2>/dev/null)
    if [ -n "$N8N_CONTAINER" ]; then
        echo "✅ ($N8N_CONTAINER running)"
    else
        echo "⚠️ (n8n container not running)"
    fi
else
    echo "❌ (docker not accessible)"
fi

echo ""
echo "========================"
echo "Tests completados"
