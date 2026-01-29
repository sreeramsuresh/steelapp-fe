#!/bin/bash

# ============================================
# GIT COMMAND WRAPPER - PREVENTS --no-verify
# ============================================
# This wrapper intercepts git commands and blocks --no-verify flag
# Usage: Copy the alias to your ~/.bashrc or ~/.zshrc
#
# Alias to add:
#   alias git='~/path/to/steelapp-fe/scripts/git-wrapper.sh'
#
# Or source this file in your shell config:
#   source ~/path/to/steelapp-fe/scripts/git-alias.sh
# ============================================

# Detect if --no-verify was used
HAS_NO_VERIFY=false
NEW_ARGS=()

for arg in "$@"; do
  if [[ "$arg" == "--no-verify" ]]; then
    HAS_NO_VERIFY=true
    # Don't add this arg to NEW_ARGS - effectively removing it
  else
    NEW_ARGS+=("$arg")
  fi
done

# If --no-verify was attempted
if [ "$HAS_NO_VERIFY" = true ]; then
  echo "⛔ ============================================"
  echo "⛔ ACCESS DENIED: --no-verify is BLOCKED"
  echo "⛔ ============================================"
  echo ""
  echo "❌ You attempted to use --no-verify to skip pre-commit checks."
  echo ""
  echo "✋ This project enforces code quality standards:"
  echo "   • ESLint validation"
  echo "   • TypeScript type checking"
  echo "   • Commit message validation"
  echo ""
  echo "💡 To fix issues and commit properly:"
  echo "   1. Run: npm run lint:fix"
  echo "   2. Review any type errors"
  echo "   3. Fix your commit message if needed"
  echo "   4. Try again without --no-verify"
  echo ""
  echo "📖 Pre-commit hooks cannot be bypassed."
  echo "   This is enforced for code quality and project integrity."
  echo ""

  exit 1
fi

# If --no-verify was NOT used, proceed normally
/usr/bin/git "${NEW_ARGS[@]}"
