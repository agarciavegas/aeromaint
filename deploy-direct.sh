#!/bin/bash
# =============================================================
# AeroMaint - Direct Deploy (Sin Docker) para Oracle Cloud
# =============================================================
# Para servidores donde Docker no está disponible o no se desea usar
# Requiere: Node.js 20+, npm
# =============================================================

set -e

echo "=========================================="
echo "  AeroMaint - Direct Deploy (Oracle Cloud)"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}Node.js $(node -v) installed.${NC}"
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"
echo -e "${GREEN}npm version: $(npm -v)${NC}"

# Clone or update repo
APP_DIR="/opt/aeromaint"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Updating existing installation...${NC}"
    cd "$APP_DIR"
    git pull origin main
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    sudo mkdir -p "$APP_DIR"
    sudo chown $(whoami) "$APP_DIR"
    git clone https://github.com/agarciavegas/aeromaint.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Setup environment
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
fi

# Generate Prisma client and setup database
echo -e "${YELLOW}Setting up database...${NC}"
npx prisma generate
npx prisma db push

# Build the app
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Prepare standalone build
echo -e "${YELLOW}Preparing standalone build...${NC}"
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
cp -r prisma .next/standalone/
mkdir -p .next/standalone/db

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
sudo tee /etc/systemd/system/aeromaint.service > /dev/null <<EOF
[Unit]
Description=AeroMaint - Airworthiness Management System
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR/.next/standalone
Environment=NODE_ENV=production
Environment=DATABASE_URL=file:$APP_DIR/db/aeromaint.db
Environment=PORT=3000
ExecStart=$(which node) server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable aeromaint
sudo systemctl restart aeromaint

# Open firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save 2>/dev/null || true
fi

# Oracle Cloud specific - also open in iptables-persistent
if [ -f /etc/iptables/rules.v4 ]; then
    sudo sed -i '/--dport 3000 -j ACCEPT/d' /etc/iptables/rules.v4 2>/dev/null || true
    echo "-A INPUT -p tcp --dport 3000 -j ACCEPT" | sudo tee -a /etc/iptables/rules.v4 > /dev/null 2>/dev/null || true
fi

# Wait and check
sleep 3
if sudo systemctl is-active --quiet aeromaint; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "  AeroMaint deployed successfully!"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "  Access the application at:"
    echo -e "  ${GREEN}http://${PUBLIC_IP}:3000${NC}"
    echo ""
    echo -e "  First time? Seed the database:"
    echo -e "  ${YELLOW}cd $APP_DIR && npx tsx prisma/seed.ts${NC}"
    echo ""
    echo -e "  Useful commands:"
    echo -e "  - View logs:     sudo journalctl -u aeromaint -f"
    echo -e "  - Stop:          sudo systemctl stop aeromaint"
    echo -e "  - Start:         sudo systemctl start aeromaint"
    echo -e "  - Restart:       sudo systemctl restart aeromaint"
    echo -e "  - Status:        sudo systemctl status aeromaint"
    echo ""
else
    echo -e "${RED}Deployment failed. Check logs:${NC}"
    echo "  sudo journalctl -u aeromaint -n 50"
    exit 1
fi
