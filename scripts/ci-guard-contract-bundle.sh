#!/bin/bash

# =============================================================================
# CI Guard: Contract Validation Bundle Safety
# =============================================================================
#
# Purpose: Prevent regression where static imports accidentally reintroduce
#          Zod + contract validation code into the production bundle.
#
# Usage: Run after `npm run build` in CI pipeline
#
# Exit Codes:
#   0 - Bundle is clean (no validation code found)
#   1 - Bundle contains validation code (FAIL)
#
# Expected: This script should PASS (exit 0) when dynamic imports are used
#           and FAIL (exit 1) if someone accidentally adds static imports.
# =============================================================================

set -e  # Exit on error

DIST_DIR="dist/assets"
FORBIDDEN_STRINGS=("zod" "ContractViolationError" "contractRegistry" "validateRequestContract")
FOUND_VIOLATIONS=0
VIOLATION_DETAILS=""

echo "========================================"
echo "CI Guard: Contract Bundle Safety Check"
echo "========================================"
echo ""
echo "Searching for forbidden strings in production bundle..."
echo "Directory: $DIST_DIR"
echo "Pattern: dist/assets/**/*.js"
echo ""

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ ERROR: dist/assets directory not found"
  echo "   Run 'npm run build' first"
  exit 1
fi

# Search for each forbidden string
for FORBIDDEN in "${FORBIDDEN_STRINGS[@]}"; do
  echo "🔍 Checking for: '$FORBIDDEN'"

  # Search in all .js files recursively (case-insensitive)
  MATCHES=$(grep -rin "$FORBIDDEN" "$DIST_DIR"/*.js 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "   ❌ FOUND in production bundle!"
    echo ""
    echo "   Matched files and line numbers:"
    echo "$MATCHES" | while IFS=: read -r file line content; do
      echo "     File: $file"
      echo "     Line: $line"
      echo "     Content: $(echo "$content" | sed 's/^[[:space:]]*//' | head -c 100)..."
      echo ""
    done

    # Store violation details for final summary
    VIOLATION_DETAILS="${VIOLATION_DETAILS}\n\n${FORBIDDEN}:\n${MATCHES}"
    FOUND_VIOLATIONS=$((FOUND_VIOLATIONS + 1))
  else
    echo "   ✅ Not found (good)"
  fi
done

echo ""
echo "========================================"

if [ $FOUND_VIOLATIONS -gt 0 ]; then
  echo "❌ FAIL: Found $FOUND_VIOLATIONS forbidden string(s) in production bundle"
  echo ""
  echo "CONTRACT VALIDATION CODE LEAKED INTO PRODUCTION!"
  echo ""
  echo "This means someone may have accidentally reintroduced static imports"
  echo "in src/services/axiosApi.js or other files that pull contract"
  echo "validation code into the production bundle."
  echo ""
  echo "Violation Summary:"
  echo "=================="
  echo -e "$VIOLATION_DETAILS"
  echo ""
  echo "How to Fix:"
  echo "==========="
  echo "1. Find the file(s) listed above that contain contract imports"
  echo "2. Change static imports to dynamic imports:"
  echo ""
  echo "   ❌ WRONG (static import):"
  echo "      import { validateContract } from './contracts'"
  echo ""
  echo "   ✅ CORRECT (dynamic import):"
  echo "      const guard = await import('./contracts/validateContract.js')"
  echo ""
  echo "3. Rebuild and verify: npm run build:ci"
  echo ""
  exit 1
else
  echo "✅ PASS: Production bundle is clean"
  echo ""
  echo "No contract validation code found in production assets."
  echo "Dynamic imports are working correctly - zero bundle impact confirmed."
  echo ""
  exit 0
fi
