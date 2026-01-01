#!/bin/bash

# Production Deployment Script for CRM Frontend
# Domain: crm.windevs.uz
# Backend API: api.crm.windevs.uz:8443

set -e

echo "🚀 Starting production deployment for crm.windevs.uz..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="crm.windevs.uz"
BACKEND_API="api.crm.windevs.uz:8443"
DOCKER_IMAGE="crm-frontend-production"
CONTAINER_NAME="crm-frontend-production"

# Functions
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run with sudo privileges"
    exit 1
fi

# Step 1: Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_status "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_status "Docker Compose is installed"

# Step 2: Check SSL certificates
echo ""
echo "🔐 Checking SSL certificates..."

if [ ! -f "ssl-certs/fullchain.pem" ] || [ ! -f "ssl-certs/privkey.pem" ]; then
    print_warning "SSL certificates not found in ssl-certs/"
    echo "Please place your SSL certificates:"
    echo "  - ssl-certs/fullchain.pem"
    echo "  - ssl-certs/privkey.pem"
    
    read -p "Do you want to continue with self-signed certificates? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Generate self-signed certificates
    echo "Generating self-signed certificates..."
    mkdir -p ssl-certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl-certs/privkey.pem \
        -out ssl-certs/fullchain.pem \
        -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=WinDevs/CN=crm.windevs.uz"
    print_status "Self-signed certificates generated"
else
    print_status "SSL certificates found"
fi

# Step 3: Check environment file
echo ""
echo "📝 Checking environment configuration..."

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    exit 1
fi
print_status "Environment file found"

# Step 4: Test backend connectivity
echo ""
echo "🔌 Testing backend connectivity..."

if curl -k -s --connect-timeout 5 "https://${BACKEND_API}/api/health" > /dev/null 2>&1; then
    print_status "Backend API is reachable at ${BACKEND_API}"
else
    print_warning "Cannot reach backend API at ${BACKEND_API}"
    echo "Please ensure the backend is running and accessible"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 5: Create logs directory
echo ""
echo "📁 Creating logs directory..."
mkdir -p logs/nginx
chmod 755 logs/nginx
print_status "Logs directory created"

# Step 6: Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."

if docker ps -a | grep -q $CONTAINER_NAME; then
    docker-compose down
    print_status "Existing containers stopped"
else
    print_status "No existing containers to stop"
fi

# Step 7: Build Docker image
echo ""
echo "🔨 Building Docker image..."

docker-compose build --no-cache frontend
print_status "Docker image built successfully"

# Step 8: Start containers
echo ""
echo "🚀 Starting containers..."

docker-compose up -d frontend
print_status "Containers started"

# Step 9: Wait for container to be healthy
echo ""
echo "⏳ Waiting for container to be healthy..."

MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null | grep -q "healthy"; then
        print_status "Container is healthy"
        break
    fi
    
    if [ $COUNTER -eq $(($MAX_WAIT - 1)) ]; then
        print_error "Container failed to become healthy"
        echo "Check logs with: docker logs $CONTAINER_NAME"
        exit 1
    fi
    
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo -n "."
done
echo ""

# Step 10: Test endpoints
echo ""
echo "🧪 Testing endpoints..."

# Test HTTP redirect
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "301"; then
    print_status "HTTP redirect is working"
else
    print_warning "HTTP redirect may not be working correctly"
fi

# Test HTTPS
if curl -k -s -o /dev/null -w "%{http_code}" https://localhost | grep -q "200"; then
    print_status "HTTPS is working"
else
    print_warning "HTTPS may not be working correctly"
fi

# Test health endpoint
if curl -k -s http://localhost/health | grep -q "healthy"; then
    print_status "Health endpoint is working"
else
    print_warning "Health endpoint may not be working correctly"
fi

# Step 11: Show container status
echo ""
echo "📊 Container status:"
docker ps -a | grep $CONTAINER_NAME

# Step 12: Show logs
echo ""
echo "📜 Recent logs:"
docker logs --tail 20 $CONTAINER_NAME

# Final instructions
echo ""
echo "=============================================="
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo "=============================================="
echo ""
echo "🌐 Your application is now running at:"
echo "   https://$DOMAIN"
echo ""
echo "📍 Backend API:"
echo "   https://$BACKEND_API"
echo ""
echo "📝 Useful commands:"
echo "   View logs:     docker logs -f $CONTAINER_NAME"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart frontend"
echo "   Rebuild:       docker-compose up -d --build frontend"
echo ""
echo "⚠️  Important next steps:"
echo "   1. Configure DNS to point $DOMAIN to this server"
echo "   2. Ensure backend API at $BACKEND_API is accessible"
echo "   3. Replace self-signed certificates with real SSL certificates"
echo "   4. Configure firewall to allow ports 80 and 443"
echo ""
