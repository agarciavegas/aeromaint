# n8n + Telegram AI Agent - Guia de Despliegue

## Resumen

Este paquete contiene todo lo necesario para desplegar un sistema de automatizacion con n8n controlado por un bot de Telegram con IA.

## Archivos incluidos

```
n8n-setup/
├── .env                          # Variables de entorno (CONFIGURAR)
├── .env.example                  # Template de variables
├── docker-compose.yml            # Docker compose para n8n
├── setup.sh                      # Script de instalacion automatica
├── config/
│   └── Caddyfile                 # Reverse proxy con HTTPS
├── scripts/
│   ├── import-workflows.sh       # Importar workflows via API
│   └── test-setup.sh             # Tests de verificacion
├── workflows/
│   └── master-ai-agent.json      # Workflow maestro (bot IA)
└── templates/
    ├── template-precio-monitor.json    # Monitor de precios
    ├── template-briefing-matutino.json # Briefing diario
    ├── template-web-scraper.json       # Scraper con deteccion de cambios
    ├── template-email-inteligente.json # Clasificador de emails con IA
    └── template-tracker-gastos.json    # Tracker de gastos via Telegram
```

## Requisitos previos

- Un VPS o servidor con Ubuntu/Debian (Oracle Cloud Free Tier recomendado)
- Acceso SSH al servidor
- Una API Key de OpenAI (https://platform.openai.com/api-keys)
- Tu bot de Telegram ya creado con @BotFather

## Instalacion rapida

### Opcion A: Instalacion automatica (recomendado)

```bash
# 1. Subir archivos al servidor
scp -r n8n-setup/ user@tu-servidor:/opt/n8n/

# 2. SSH al servidor
ssh user@tu-servidor

# 3. Entrar al directorio
cd /opt/n8n

# 4. Editar .env con tus valores
nano .env

# 5. Ejecutar setup
bash setup.sh
```

### Opcion B: Instalacion manual

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2. Subir archivos al servidor
scp -r n8n-setup/ user@tu-servidor:/opt/n8n/

# 3. SSH al servidor
ssh user@tu-servidor
cd /opt/n8n

# 4. Editar .env
nano .env
# IMPORTANTE: Configura al menos:
#   - TELEGRAM_BOT_TOKEN
#   - TELEGRAM_CHAT_ID
#   - OPENAI_API_KEY
#   - N8N_PASSWORD (cambia la default)

# 5. Levantar n8n
docker compose up -d

# 6. Esperar a que arranque
curl http://localhost:5678/healthz

# 7. Abrir n8n en el navegador
# http://tu-servidor:5678
# Login con usuario/password de .env

# 8. Generar API Key
# Settings > n8n API > Create API Key
# Guardar la key en .env como N8N_API_KEY

# 9. Reiniciar n8n para que coja la API Key
docker compose restart

# 10. Importar workflows
bash scripts/import-workflows.sh
```

## Configuracion post-instalacion

### 1. Configurar credenciales en n8n

Despues de importar los workflows, necesitas configurar las credenciales en n8n:

- **Telegram API**: Bot Token
- **OpenAI API**: API Key
- **HTTP Header Auth**: Para la API de n8n (usa la API Key generada)
- **Google Sheets**: OAuth2 (para el tracker de gastos)
- **Email (IMAP)**: Para el email inteligente

### 2. Activar el workflow maestro

1. Ve a n8n > Workflows > "Master AI Agent - Telegram Bot"
2. Configura las credenciales de Telegram y OpenAI
3. Configura el HTTP Header Auth para la n8n API
4. Activa el workflow (toggle en la esquina superior)

### 3. Probar el bot

Escribe a tu bot en Telegram:

```
/start
```

Deberia responder con un mensaje de bienvenida.

### 4. Comandos disponibles

Puedes pedirle cosas en lenguaje natural:

- "Que workflows tengo activos?"
- "Crea un monitor para la web X"
- "Elimina el workflow Y"
- "Activa el briefing matutino"
- "Desactiva el monitor de precios"
- "Cuantas veces se ejecuto X esta semana?"

## Workflows incluidos

### Master AI Agent (obligatorio)
El cerebro del sistema. Recibe mensajes de Telegram, los procesa con IA, y usa las herramientas de la n8n API para gestionar workflows.

### Monitor de Precios
Vigila una web cada 30 minutos y te avisa si el precio baja de tu objetivo.

### Briefing Matutino
Cada dia a las 7:00 te envia un resumen con tiempo, divisas y eventos.

### Web Scraper
Monitoriza una web cada hora y te avisa si hay cambios en el contenido.

### Email Inteligente
Clasifica tus emails con IA y te avisa de los urgentes por Telegram.

### Tracker de Gastos
Registra gastos via Telegram (/gasto 25 comida pizza) y los guarda en Google Sheets.

## Seguridad

- **REGENERA tu token de Telegram** en @BotFather con /revoke
- Cambia la password default de n8n
- El bot solo responde a tu chat_id
- Las operaciones destructivas requieren confirmacion
- Nunca compartas tu .env

## Troubleshooting

### n8n no arranca
```bash
docker compose logs n8n
docker compose restart
```

### El bot no responde
1. Verifica que el workflow maestro esta activo
2. Verifica las credenciales de Telegram en n8n
3. Verifica la API Key de OpenAI

### Error de API
1. Verifica que N8N_API_KEY esta en .env
2. Verifica que la API Key tiene permisos
3. Ejecuta: bash scripts/test-setup.sh

### Ver logs
```bash
docker compose logs -f n8n
```

## Actualizar n8n

```bash
cd /opt/n8n
docker compose pull
docker compose up -d
```
