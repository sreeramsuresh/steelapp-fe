#!/bin/bash

# ============================================
# GIT WRAPPER ALIAS SETUP
# Prevents --no-verify usage
# ============================================
#
# Add this to your ~/.bashrc, ~/.zshrc, or ~/.fish/config.fish
#
# For Bash/Zsh:
#   source /path/to/steelapp-fe/scripts/git-alias.sh
#
# For Fish:
#   source /path/to/steelapp-fe/scripts/git-alias-fish.fish
#
# ============================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER_SCRIPT="$SCRIPT_DIR/git-wrapper.sh"

# Make wrapper executable
if [ -f "$WRAPPER_SCRIPT" ]; then
  chmod +x "$WRAPPER_SCRIPT"
fi

# Create alias that intercepts git command
alias git="$WRAPPER_SCRIPT"

echo "✅ Git wrapper activated!"
echo "   • --no-verify flag is now BLOCKED"
echo "   • Pre-commit hooks are MANDATORY"
echo "   • Type 'unalias git' to disable temporarily"
