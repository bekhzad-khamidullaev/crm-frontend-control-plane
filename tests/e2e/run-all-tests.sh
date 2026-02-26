#!/bin/bash

# E2E Testing Suite Runner
# Runs all comprehensive E2E tests with Playwright in headless mode

set -e

echo "🚀 Starting comprehensive E2E testing suite..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-http://localhost:3000}
HEADLESS=${HEADLESS:-true}
WORKERS=${WORKERS:-2}
RETRIES=${RETRIES:-1}

echo -e "${BLUE}Configuration:${NC}"
echo "  Base URL: $BASE_URL"
echo "  Headless: $HEADLESS"
echo "  Workers: $WORKERS"
echo "  Retries: $RETRIES"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${YELLOW}Server not running at $BASE_URL. Starting dev server...${NC}"
    npm run dev &
    SERVER_PID=$!
    sleep 5
    echo -e "${GREEN}Dev server started (PID: $SERVER_PID)${NC}"
else
    echo -e "${GREEN}Server is already running${NC}"
fi

echo ""
echo -e "${BLUE}Running E2E tests...${NC}"
echo ""

# Run tests
export PLAYWRIGHT_HEADLESS=$HEADLESS
export BASE_URL=$BASE_URL

# Test suites
TESTS=(
    "comprehensive-crud.spec.js"
    "api-integration.spec.js"
    "ui-smoke-test.spec.js"
    "theme-switching.spec.js"
)

FAILED_TESTS=()
PASSED_TESTS=()

for test in "${TESTS[@]}"; do
    echo -e "${YELLOW}Running $test...${NC}"
    
    if npx playwright test "tests/e2e/$test" \
        --config=playwright.config.headless.js \
        --workers=$WORKERS \
        --retries=$RETRIES \
        --reporter=list; then
        PASSED_TESTS+=("$test")
        echo -e "${GREEN}✓ $test passed${NC}"
    else
        FAILED_TESTS+=("$test")
        echo -e "${RED}✗ $test failed${NC}"
    fi
    
    echo ""
done

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
    echo -e "${GREEN}Passed tests:${NC}"
    for test in "${PASSED_TESTS[@]}"; do
        echo "  ✓ $test"
    done
    echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  ✗ $test"
    done
    echo ""
fi

# Generate report
echo -e "${BLUE}Generating HTML report...${NC}"
echo "Report available at: playwright-report/index.html"
echo ""

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Cleaning up dev server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
fi

# Exit with error if any tests failed
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    exit 1
else
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
fi
