#!/bin/bash
# ============================================================
# n8n Setup Script - Despliegue automatizado
# Para: Oracle Cloud Free Tier / VPS con Ubuntu/Debian
# ============================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║     n8n + Telegram AI Agent Setup       ║"
echo "║     Despliegue automatizado              ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# --- 1. Verificar requisitos ---
echo -e "${YELLOW}[1/8] Verificando requisitos...${NC}"

command -v docker >/dev/null 2>&1 || {
    echo -e "${RED}Docker no esta instalado. Instalando...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker instalado.${NC}"
}

command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || {
    echo -e "${RED}Docker Compose no instalado. Instalando...${NC}"
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose instalado.${NC}"
}

echo -e "${GREEN}✓ Todos los requisitos cumplidos${NC}"

# --- 2. Verificar .env ---
echo -e "${YELLOW}[2/8] Verificando configuracion...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}No se encontro .env. Creando desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Edita .env con tus valores antes de continuar.${NC}"
    echo -e "${YELLOW}Especialmente: TELEGRAM_BOT_TOKEN, OPENAI_API_KEY${NC}"
    exit 1
fi

# Cargar variables
source .env

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "tu_token_aqui" ]; then
    echo -e "${RED}ERROR: TELEGRAM_BOT_TOKEN no configurado en .env${NC}"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-tu_openai_api_key_aqui" ]; then
    echo -e "${YELLOW}AVISO: OPENAI_API_KEY no configurada. El agente IA no funcionara hasta que la configures.${NC}"
    echo -e "${YELLOW}Puedes obtener una en: https://platform.openai.com/api-keys${NC}"
    read -p "Continuar sin OpenAI? (s/n): " CONTINUE
    if [ "$CONTINUE" != "s" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Configuracion verificada${NC}"

# --- 3. Configurar firewall ---
echo -e "${YELLOW}[3/8] Configurando firewall...${NC}"

sudo ufw allow 80/tcp >/dev/null 2>&1 || true
sudo ufw allow 443/tcp >/dev/null 2>&1 || true
sudo ufw allow 5678/tcp >/dev/null 2>&1 || true
sudo ufw --force enable >/dev/null 2>&1 || true

echo -e "${GREEN}✓ Firewall configurado (puertos 80, 443, 5678)${NC}"

# --- 4. Levantar n8n ---
echo -e "${YELLOW}[4/8] Levantando n8n con Docker...${NC}"

docker compose up -d

echo -e "${GREEN}✓ n8n levantado${NC}"

# --- 5. Esperar a que n8n este listo ---
echo -e "${YELLOW}[5/8] Esperando a que n8n este listo...${NC}"

MAX_RETRIES=30
RETRY=0
until curl -s http://localhost:5678/healthz > /dev/null 2>&1; do
    RETRY=$((RETRY+1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        echo -e "${RED}n8n no responde despues de $MAX_RETRIES intentos.${NC}"
        echo -e "${YELLOW}Revisa los logs: docker compose logs n8n${NC}"
        exit 1
    fi
    echo -e "  Esperando... ($RETRY/$MAX_RETRIES)"
    sleep 5
done

echo -e "${GREEN}✓ n8n esta listo en http://localhost:5678${NC}"

# --- 6. Generar API Key ---
echo -e "${YELLOW}[6/8] Generando API Key de n8n...${NC}"
echo -e "${YELLOW}Para completar este paso, haz lo siguiente:${NC}"
echo -e ""
echo -e "  1. Abre ${BLUE}http://localhost:5678${NC} en tu navegador"
echo -e "  2. Inicia sesion con usuario: ${GREEN}${N8N_USER}${NC} y password: ${GREEN}${N8N_PASSWORD}${NC}"
echo -e "  3. Ve a ${BLUE}Settings > n8n API${NC}"
echo -e "  4. Crea una API Key con el label: ${GREEN}'Telegram Bot Agent'${NC}"
echo -e "  5. Copia la API Key y pegala aqui:"
echo -e ""
read -p "  API Key de n8n: " N8N_API_KEY_VALUE

if [ -n "$N8N_API_KEY_VALUE" ]; then
    # Actualizar .env con la API Key
    sed -i "s/^N8N_API_KEY=.*/N8N_API_KEY=${N8N_API_KEY_VALUE}/" .env
    echo -e "${GREEN}✓ API Key guardada en .env${NC}"
else
    echo -e "${YELLOW}⚠ No se guardo API Key. Los workflows del bot no funcionaran hasta que la configures.${NC}"
fi

# --- 7. Importar workflows ---
echo -e "${YELLOW}[7/8] Importando workflows...${NC}"

source .env

# Funcion para importar un workflow
import_workflow() {
    local file=$1
    local name=$(basename "$file" .json)
    
    if [ -z "$N8N_API_KEY_VALUE" ]; then
        echo -e "${YELLOW}  ⚠ Saltando $name (sin API Key)${NC}"
        return
    fi
    
    RESPONSE=$(curl -s -X POST http://localhost:5678/api/v1/workflows \
        -H "X-N8N-API-KEY: $N8N_API_KEY_VALUE" \
        -H "Content-Type: application/json" \
        -d @"$file" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '"id"'; then
        echo -e "${GREEN}  ✓ Importado: $name${NC}"
    else
        echo -e "${YELLOW}  ⚠ Error importando $name${NC}"
    fi
}

# Importar workflow maestro
if [ -f workflows/master-ai-agent.json ]; then
    import_workflow workflows/master-ai-agent.json
fi

# Importar templates
for file in templates/*.json; do
    if [ -f "$file" ]; then
        import_workflow "$file"
    fi
done

echo -e "${GREEN}✓ Workflows importados${NC}"

# --- 8. Verificar Telegram Bot ---
echo -e "${YELLOW}[8/8] Verificando conexion con Telegram...${NC}"

BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" 2>/dev/null)

if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_NAME=$(echo "$BOT_INFO" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Bot conectado: @${BOT_NAME}${NC}"
else
    echo -e "${RED}✗ Error conectando con Telegram. Verifica el token.${NC}"
fi

# --- Resumen final ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗"
echo -e "║          SETUP COMPLETADO! 🎉           ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  n8n:        ${BLUE}http://localhost:5678${NC}"
echo -e "  Usuario:    ${GREEN}${N8N_USER}${NC}"
echo -e "  Password:   ${GREEN}${N8N_PASSWORD}${NC}"
echo ""
echo -e "  ${YELLOW}PROXIMOS PASOS:${NC}"
echo ""
echo -e "  1. Abre n8n en tu navegador"
echo -e "  2. Ve a los workflows importados y activa el 'Master AI Agent'"
echo -e "  3. Ve a Telegram y escribe /start a tu bot"
echo -e "  4. Si aun no has configurado OPENAI_API_KEY, hazlo en .env y reinicia:"
echo -e "     ${BLUE}docker compose restart${NC}"
echo ""
echo -e "  ${RED}IMPORTANTE: Regenera tu token de Telegram en @BotFather${NC}"
echo -e "  ${RED}con el comando /revoke por seguridad${NC}"
echo ""
