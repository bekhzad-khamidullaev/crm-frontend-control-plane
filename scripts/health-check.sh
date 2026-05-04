#!/bin/bash
# Health check script for monitoring deployment

set -e

# Configuration
PRODUCTION_URL="https://windevs.uz/health"
STAGING_URL="https://staging.windevs.uz/health"
API_URL="https://crm.windevs.uz/api/health/"
PBX_URL="https://pbx.windevs.uz"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
    local name=$1
    local url=$2
    local timeout=${3:-5}
    
    echo -n "Checking $name... "
    
    if curl -f -s -m $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

echo "🏥 CRM Frontend Health Check"
echo "=============================="
echo ""

# Check production frontend
check_endpoint "Production Frontend" "$PRODUCTION_URL"
PROD_STATUS=$?

# Check staging frontend
check_endpoint "Staging Frontend" "$STAGING_URL"
STAGING_STATUS=$?

# Check API backend
check_endpoint "API Backend" "$API_URL" 10
API_STATUS=$?

# Check PBX server
check_endpoint "PBX Server" "$PBX_URL" 10
PBX_STATUS=$?

echo ""
echo "=============================="

# Summary
TOTAL=$((PROD_STATUS + STAGING_STATUS + API_STATUS + PBX_STATUS))

if [ $TOTAL -eq 0 ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some services are down (failed: $TOTAL/4)${NC}"
    exit 1
fi
