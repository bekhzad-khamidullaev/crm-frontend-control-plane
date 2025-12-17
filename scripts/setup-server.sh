#!/bin/bash
# Server setup script for first-time deployment
# Run this on your production/staging server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 CRM Frontend Server Setup${NC}"
echo "=============================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${GREEN}▶ Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install Docker
echo -e "${GREEN}▶ Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Add user to docker group
    usermod -aG docker $SUDO_USER || true
    
    echo -e "${YELLOW}⚠️  Log out and back in for docker group changes to take effect${NC}"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo -e "${GREEN}▶ Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Install Nginx (for reverse proxy)
echo -e "${GREEN}▶ Installing Nginx...${NC}"
apt-get install -y nginx

# Install Certbot for SSL
echo -e "${GREEN}▶ Installing Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Install other utilities
echo -e "${GREEN}▶ Installing utilities...${NC}"
apt-get install -y git curl wget htop ufw fail2ban

# Configure firewall
echo -e "${GREEN}▶ Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5060/tcp  # SIP
ufw allow 5061/tcp  # SIP TLS
ufw allow 10000:20000/udp  # RTP media
ufw reload

# Create project directory
echo -e "${GREEN}▶ Creating project directory...${NC}"
mkdir -p /opt/crm-frontend
chown -R $SUDO_USER:$SUDO_USER /opt/crm-frontend

# Create logs directory
mkdir -p /opt/crm-frontend/logs/nginx
chown -R $SUDO_USER:$SUDO_USER /opt/crm-frontend/logs

# Setup SSL certificates
echo -e "${GREEN}▶ Setting up SSL certificates...${NC}"
echo -e "${YELLOW}Run the following command to obtain SSL certificates:${NC}"
echo "sudo certbot --nginx -d windevs.uz -d www.windevs.uz"
echo ""
echo -e "${YELLOW}For staging:${NC}"
echo "sudo certbot --nginx -d staging.windevs.uz"

# Enable Docker service
systemctl enable docker
systemctl start docker

# Print status
echo ""
echo -e "${GREEN}✅ Server setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Clone the repository to /opt/crm-frontend"
echo "2. Configure environment variables (.env.production)"
echo "3. Obtain SSL certificates with certbot"
echo "4. Run deployment script: ./deploy.sh production"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "- Log out and back in for docker group permissions"
echo "- Configure your DNS to point to this server"
echo "- Update nginx.conf with correct SSL certificate paths"
echo "- Set up GitHub secrets for CI/CD deployment"
