#!/bin/bash

# Verify E2E Test Setup - Ultimate Steel ERP
# This script checks if all prerequisites are met for running E2E tests

set -e

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  E2E Test Setup Verification"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check flags
CHROME_OK=0
SERVICES_OK=0
NODE_OK=0

# 1. Check Node.js
echo "${BLUE}ℹ${NC} Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
  NODE_OK=1
else
  echo "${RED}✗${NC} Node.js not found. Please install Node.js 16+"
  NODE_OK=0
fi
echo ""

# 2. Check npm
echo "${BLUE}ℹ${NC} Checking npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
  echo "${RED}✗${NC} npm not found"
fi
echo ""

# 3. Check Puppeteer
echo "${BLUE}ℹ${NC} Checking Puppeteer..."
if [ -d "node_modules/puppeteer" ]; then
  echo "${GREEN}✓${NC} Puppeteer npm package installed"
else
  echo "${YELLOW}⚠${NC} Puppeteer npm package not found"
  echo "   Run: npm install puppeteer --save-dev"
fi
echo ""

# 4. Check Chromium
echo "${BLUE}ℹ${NC} Checking Chromium..."
CHROME_PATH="/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome"
if [ -f "$CHROME_PATH" ]; then
  echo "${GREEN}✓${NC} Chromium installed at:"
  echo "   $CHROME_PATH"
  CHROME_OK=1
else
  echo "${YELLOW}⚠${NC} Chromium not found"
  echo "   Run: npx @puppeteer/browsers install chromium@latest --platform=linux"
  CHROME_OK=0
fi
echo ""

# 5. Check Frontend Service
echo "${BLUE}ℹ${NC} Checking Frontend service (http://localhost:5173)..."
if nc -z localhost 5173 2>/dev/null; then
  echo "${GREEN}✓${NC} Frontend service is running"
else
  echo "${YELLOW}⚠${NC} Frontend service not responding"
  echo "   Start with: npm run dev"
fi
echo ""

# 6. Check API Gateway
echo "${BLUE}ℹ${NC} Checking API Gateway (http://localhost:3000)..."
if nc -z localhost 3000 2>/dev/null; then
  echo "${GREEN}✓${NC} API Gateway is running"
else
  echo "${YELLOW}⚠${NC} API Gateway not responding"
  echo "   Make sure backend is running on port 3000"
fi
echo ""

# 7. Check PostgreSQL
echo "${BLUE}ℹ${NC} Checking PostgreSQL (localhost:5432)..."
if nc -z localhost 5432 2>/dev/null; then
  echo "${GREEN}✓${NC} PostgreSQL is running"
else
  echo "${YELLOW}⚠${NC} PostgreSQL not responding"
  echo "   Make sure database is running on port 5432"
fi
echo ""

# 8. Check test files
echo "${BLUE}ℹ${NC} Checking test files..."
TEST_FILES=(
  "tests/e2e/supplier-form.test.js"
  "tests/e2e/puppeteer-utils.js"
  "tests/e2e/README.md"
  "tests/e2e/SUPPLIER_FORM_TESTS.md"
)

for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "${GREEN}✓${NC} $file"
  else
    echo "${RED}✗${NC} $file (missing)"
  fi
done
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  Verification Summary"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

READY=1

if [ $NODE_OK -eq 1 ]; then
  echo "${GREEN}✓${NC} Node.js: OK"
else
  echo "${RED}✗${NC} Node.js: MISSING"
  READY=0
fi

if [ $CHROME_OK -eq 1 ]; then
  echo "${GREEN}✓${NC} Chromium: OK"
else
  echo "${YELLOW}⚠${NC} Chromium: NEEDS SETUP"
fi

if nc -z localhost 5173 2>/dev/null; then
  echo "${GREEN}✓${NC} Frontend: OK"
else
  echo "${YELLOW}⚠${NC} Frontend: NOT RUNNING"
fi

if nc -z localhost 3000 2>/dev/null; then
  echo "${GREEN}✓${NC} API Gateway: OK"
else
  echo "${YELLOW}⚠${NC} API Gateway: NOT RUNNING"
fi

if nc -z localhost 5432 2>/dev/null; then
  echo "${GREEN}✓${NC} Database: OK"
else
  echo "${YELLOW}⚠${NC} Database: NOT RUNNING"
fi

echo ""

if [ $READY -eq 1 ] && [ $CHROME_OK -eq 1 ]; then
  if nc -z localhost 5173 2>/dev/null && nc -z localhost 3000 2>/dev/null; then
    echo "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo "${GREEN}  READY TO RUN TESTS${NC}"
    echo "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Run tests with:"
    echo "  ${BLUE}node tests/e2e/supplier-form.test.js${NC}"
    echo ""
    exit 0
  else
    echo "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo "${YELLOW}  START SERVICES AND TRY AGAIN${NC}"
    echo "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Start services:"
    echo "  Terminal 1: ${BLUE}cd /mnt/d/Ultimate\\ Steel/steelapp-fe && npm run dev${NC}"
    echo "  Terminal 2: ${BLUE}cd /mnt/d/Ultimate\\ Steel/backend && npm run dev${NC}"
    echo ""
    exit 1
  fi
else
  if [ $CHROME_OK -eq 0 ]; then
    echo "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo "${YELLOW}  INSTALL CHROMIUM FIRST${NC}"
    echo "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Install Chromium:"
    echo "  ${BLUE}npx @puppeteer/browsers install chromium@latest --platform=linux${NC}"
    echo ""
    exit 1
  fi

  echo "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo "${RED}  MISSING REQUIRED COMPONENTS${NC}"
  echo "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
  exit 1
fi
