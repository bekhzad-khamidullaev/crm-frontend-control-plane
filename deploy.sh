#!/bin/bash
# Production deployment script for CRM Frontend
# Usage: ./deploy.sh [environment]
# Environments: production, staging, local

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT="${1:-production}"

# Configuration
PROJECT_NAME="crm-frontend"
DOCKER_IMAGE="ghcr.io/windevs/crm-frontend"
DEPLOY_DIR="/opt/crm-frontend"

echo -e "${BLUE}🚀 CRM Frontend Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|local)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Valid options: production, staging, local"
    exit 1
fi

# Function to print step
print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ Error: $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi

# Local deployment
if [ "$ENVIRONMENT" = "local" ]; then
    print_step "Building for local environment..."
    
    # Build with Docker
    docker-compose build frontend
    
    print_step "Starting containers..."
    docker-compose up -d frontend
    
    print_success "Local deployment complete!"
    echo -e "${BLUE}Access the application at: http://localhost${NC}"
    
    # Show logs
    print_step "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f frontend
    
    exit 0
fi

# Production/Staging deployment
print_step "Pulling latest changes from Git..."
git pull origin $(git rev-parse --abbrev-ref HEAD)

print_step "Pulling latest Docker image..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker pull $DOCKER_IMAGE:latest
else
    docker pull $DOCKER_IMAGE:staging
fi

print_step "Stopping old containers..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose down frontend || true
else
    docker-compose --profile staging down frontend-staging || true
fi

print_step "Starting new containers..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose up -d frontend
else
    docker-compose --profile staging up -d frontend-staging
fi

print_step "Waiting for container to be healthy..."
sleep 5

# Check health
if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="http://localhost/health"
else
    HEALTH_URL="http://localhost:8080/health"
fi

RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s $HEALTH_URL > /dev/null; then
        print_success "Container is healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Container health check failed"
    print_step "Showing logs..."
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose logs frontend
    else
        docker-compose --profile staging logs frontend-staging
    fi
    exit 1
fi

print_step "Cleaning up old images..."
docker image prune -f

print_success "Deployment complete!"
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose ps frontend
    echo ""
    echo -e "${BLUE}🌐 Access URL: https://windevs.uz${NC}"
else
    docker-compose --profile staging ps frontend-staging
    echo ""
    echo -e "${BLUE}🌐 Access URL: https://staging.windevs.uz${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f frontend"
echo "  Stop:         docker-compose down frontend"
echo "  Restart:      docker-compose restart frontend"
echo "  Shell:        docker-compose exec frontend sh"
