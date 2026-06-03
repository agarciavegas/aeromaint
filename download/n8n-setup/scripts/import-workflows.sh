#!/bin/bash
# ============================================================
# Script para importar workflows via API de n8n
# Uso: bash import-workflows.sh
# ============================================================

set -e

# Cargar variables
source .env

API_BASE="http://localhost:5678/api/v1"
API_KEY="${N8N_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "ERROR: N8N_API_KEY no configurada en .env"
    echo "Genera una en: n8n > Settings > n8n API > Create API Key"
    exit 1
fi

echo "Importando workflows a n8n..."
echo "API Base: $API_BASE"
echo ""

import_workflow() {
    local file=$1
    local name=$(basename "$file" .json)
    
    echo -n "  Importando $name... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/workflows" \
        -H "X-N8N-API-KEY: $API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$file" 2>/dev/null)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        WF_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "✅ (ID: $WF_ID)"
    else
        echo "❌ (HTTP $HTTP_CODE)"
        echo "    $BODY" | head -c 200
        echo ""
    fi
}

# Importar workflow maestro
echo "📋 Workflow maestro:"
if [ -f workflows/master-ai-agent.json ]; then
    import_workflow workflows/master-ai-agent.json
fi

# Importar templates
echo ""
echo "📋 Templates:"
for file in templates/*.json; do
    if [ -f "$file" ]; then
        import_workflow "$file"
    fi
done

echo ""
echo "✅ Importacion completada!"
echo ""
echo "PROXIMOS PASOS:"
echo "  1. Abre http://localhost:5678"
echo "  2. Ve a cada workflow y configura las credenciales (Telegram, OpenAI, etc.)"
echo "  3. Activa los workflows que quieras usar"
echo "  4. Escribe /start a tu bot de Telegram"
