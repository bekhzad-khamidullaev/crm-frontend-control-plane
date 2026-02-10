#!/bin/bash

# E2E Test Runner Script for CRM Application
# This script runs Playwright tests with proper setup and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CRM E2E Test Suite Runner          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found. Please install Node.js${NC}"
    exit 1
fi

# Check if Playwright browsers are installed
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}⚠ Playwright browsers not installed${NC}"
    echo -e "${BLUE}Installing Playwright browsers...${NC}"
    npx playwright install chromium
fi

# Parse arguments
MODE=${1:-all}
HEADED=${2:-false}

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Mode: ${GREEN}$MODE${NC}"
echo -e "  Headless: ${GREEN}$([ "$HEADED" = "true" ] && echo "false" || echo "true")${NC}"
echo -e "  Base URL: ${GREEN}http://localhost:3000${NC}"
echo -e "  API Target: ${GREEN}https://api.crm.windevs.uz${NC}"
echo ""

# Build test command
TEST_CMD="npx playwright test"
[ "$HEADED" = "true" ] && TEST_CMD="$TEST_CMD --headed"

# Run tests based on mode
case $MODE in
  login)
    echo -e "${BLUE}Running Login Tests...${NC}"
    $TEST_CMD login.spec.js
    ;;
  leads)
    echo -e "${BLUE}Running Leads Module Tests...${NC}"
    $TEST_CMD leads.spec.js
    ;;
  contacts)
    echo -e "${BLUE}Running Contacts Module Tests...${NC}"
    $TEST_CMD contacts.spec.js
    ;;
  integration)
    echo -e "${BLUE}Running Integration Tests...${NC}"
    $TEST_CMD integration.spec.js
    ;;
  all)
    echo -e "${BLUE}Running All E2E Tests...${NC}"
    $TEST_CMD
    ;;
  *)
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo -e "${YELLOW}Usage: $0 [login|leads|contacts|integration|all] [headed]${NC}"
    exit 1
    ;;
esac

# Check test result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ All Tests Passed Successfully     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}View detailed report:${NC} npm run test:e2e:report"
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ Some Tests Failed                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}View report for details:${NC} npm run test:e2e:report"
    exit 1
fi
