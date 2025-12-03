#!/bin/bash

###############################################################################
# Role Management Test Runner Script
#
# This script runs all tests for the role management system:
# - Unit tests (validation logic)
# - Integration tests (API endpoints)
# - E2E tests (UI flows)
#
# Usage:
#   ./runRoleTests.sh [unit|integration|e2e|all|coverage]
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji for status (if terminal supports it)
CHECKMARK="✓"
CROSS="✗"
ROCKET="🚀"
CLIPBOARD="📋"

echo -e "${BLUE}${ROCKET} Role Management Test Suite${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to run unit tests
run_unit_tests() {
    echo -e "\n${YELLOW}Running Unit Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    npx vitest run src/tests/unit/roleValidation.test.js --reporter=verbose

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECKMARK} Unit Tests Passed${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Unit Tests Failed${NC}"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    echo -e "\n${YELLOW}Running Integration Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    npx vitest run src/tests/integration/roleEndpoints.test.js --reporter=verbose

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECKMARK} Integration Tests Passed${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Integration Tests Failed${NC}"
        return 1
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    echo -e "\n${YELLOW}Running E2E Tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if backend is running
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${RED}${CROSS} Backend server not running on http://localhost:3000${NC}"
        echo "Please start the backend server first:"
        echo "  cd ../steelapp-be && npm run dev"
        return 1
    fi

    # Check if frontend is running
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${RED}${CROSS} Frontend server not running on http://localhost:5173${NC}"
        echo "Please start the frontend server first:"
        echo "  npm run dev"
        return 1
    fi

    echo -e "${GREEN}${CHECKMARK} Servers are running${NC}"

    npx cypress run --spec "cypress/e2e/role-management.cy.js" --reporter spec

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECKMARK} E2E Tests Passed${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} E2E Tests Failed${NC}"
        return 1
    fi
}

# Function to run all tests with coverage
run_coverage() {
    echo -e "\n${YELLOW}Running All Tests with Coverage...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Run unit and integration tests with coverage
    npx vitest run src/tests/ --coverage

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECKMARK} Tests Passed${NC}"
        echo -e "\n${BLUE}${CLIPBOARD} Coverage Report Generated${NC}"
        echo "View the report at: coverage/index.html"
        return 0
    else
        echo -e "${RED}${CROSS} Tests Failed${NC}"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local failed=0

    run_unit_tests || failed=1
    run_integration_tests || failed=1

    # E2E tests are optional (require servers running)
    echo -e "\n${YELLOW}E2E tests require servers to be running.${NC}"
    echo "Do you want to run E2E tests? (y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        run_e2e_tests || failed=1
    else
        echo -e "${YELLOW}Skipping E2E tests${NC}"
    fi

    echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}${CHECKMARK} All Tests Passed!${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Some Tests Failed${NC}"
        return 1
    fi
}

# Function to display usage
display_usage() {
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  unit         Run unit tests only"
    echo "  integration  Run integration tests only"
    echo "  e2e          Run E2E tests only"
    echo "  coverage     Run all tests with coverage report"
    echo "  all          Run all tests (default)"
    echo "  help         Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit                  # Run unit tests"
    echo "  $0 integration           # Run integration tests"
    echo "  $0 e2e                   # Run E2E tests"
    echo "  $0 coverage              # Run with coverage"
    echo "  $0                       # Run all tests"
    echo ""
}

# Function to display test summary
display_summary() {
    echo -e "\n${BLUE}Test Suite Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Unit Tests:        33 test cases"
    echo "  Integration Tests: 30 test cases"
    echo "  E2E Tests:         47 test scenarios"
    echo "  ────────────────────────────────────"
    echo "  Total:            110 tests"
    echo "  Coverage Target:   ≥80%"
    echo ""
}

# Main script logic
main() {
    local test_type="${1:-all}"

    case $test_type in
        unit)
            run_unit_tests
            exit $?
            ;;
        integration)
            run_integration_tests
            exit $?
            ;;
        e2e)
            run_e2e_tests
            exit $?
            ;;
        coverage)
            run_coverage
            exit $?
            ;;
        all)
            run_all_tests
            exit $?
            ;;
        help|--help|-h)
            display_usage
            display_summary
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option: $test_type${NC}"
            display_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
