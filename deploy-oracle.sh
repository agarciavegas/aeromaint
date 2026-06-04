#!/bin/bash
# =============================================================
# AeroMaint - Deploy Script for Oracle Cloud
# =============================================================
# Usage: ./deploy-oracle.sh
# This script deploys AeroMaint using Docker on Oracle Cloud
# =============================================================

set -e

echo "=========================================="
echo "  AeroMaint - Oracle Cloud Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    echo -e "${GREEN}Docker installed.${NC}"
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose V2 not found. Installing...${NC}"
    sudo apt-get install -y docker-compose-plugin 2>/dev/null || \
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose 2>/dev/null
    echo -e "${GREEN}Docker Compose installed.${NC}"
fi

# Create .env if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env created from .env.example${NC}"
fi

# Open firewall port 3000
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
# Save iptables rule
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save 2>/dev/null || true
fi
echo -e "${GREEN}Firewall configured (port 3000 open).${NC}"

# Build and deploy
echo -e "${YELLOW}Building Docker image...${NC}"
sudo docker compose build --no-cache

echo -e "${YELLOW}Starting AeroMaint...${NC}"
sudo docker compose up -d

# Wait for container
echo -e "${YELLOW}Waiting for application to start...${NC}"
sleep 5

# Check if running
if sudo docker compose ps | grep -q "Up"; then
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "  AeroMaint deployed successfully!"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "  Access the application at:"
    echo -e "  ${GREEN}http://${PUBLIC_IP}:3000${NC}"
    echo ""
    echo -e "  First time? Seed the database with:"
    echo -e "  ${YELLOW}sudo docker compose exec aeromaint npx tsx prisma/seed.ts${NC}"
    echo ""
    echo -e "  Useful commands:"
    echo -e "  - View logs:     sudo docker compose logs -f"
    echo -e "  - Stop:          sudo docker compose down"
    echo -e "  - Restart:       sudo docker compose restart"
    echo -e "  - Rebuild:       sudo docker compose up -d --build"
    echo ""
else
    echo -e "${RED}Deployment failed. Check logs with: sudo docker compose logs${NC}"
    exit 1
fi
