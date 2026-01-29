# Anti-Bypass Git Hooks Setup

## Overview

This project now enforces pre-commit checks that **cannot be bypassed** with `--no-verify`. This ensures code quality standards are maintained across the entire team.

---

## How It Works

### Layer 1: Husky Pre-Commit Hook (Automatic)
- **File:** `.husky/pre-commit`
- **Runs automatically** when you run `git commit`
- **Cannot be skipped** - Husky hooks execute before Git processes the commit
- **Enforces:**
  - ESLint validation on staged files
  - TypeScript type checking on staged files
  - No invalid syntax

### Layer 2: Commit Message Validation (Automatic)
- **File:** `.husky/commit-msg`
- **Validates:** Commit message quality
- **Enforces:**
  - Non-empty messages
  - Minimum 10 characters
  - Recommended message format (feat:, fix:, etc.)

### Layer 3: Command-Line Wrapper (Optional but Recommended)
- **File:** `scripts/git-wrapper.sh`
- **Purpose:** Prevents `--no-verify` flag from being used
- **Setup:** Add to your shell config
- **Benefit:** Blocks the flag at the command level before Git even processes it

---

## Setup Instructions

### Option A: Automatic (Husky Only) ⭐ Recommended
No additional setup needed! Husky hooks activate automatically when you:
```bash
npm install  # Installs husky hooks
```

### Option B: Manual + Command Wrapper (Extra Security)

**For Bash Users:**

Add to your `~/.bashrc`:
```bash
source /path/to/steelapp-fe/scripts/git-alias.sh
```

Then reload:
```bash
source ~/.bashrc
```

**For Zsh Users:**

Add to your `~/.zshrc`:
```bash
source /path/to/steelapp-fe/scripts/git-alias.sh
```

Then reload:
```bash
source ~/.zshrc
```

**For Fish Users:**

Add to your `~/.config/fish/config.fish`:
```fish
/path/to/steelapp-fe/scripts/git-wrapper.sh commit $argv
```

---

## What Happens If You Try --no-verify?

### With Husky Only (Automatic):
```bash
$ git commit --no-verify -m "Skip checks"

# ❌ Result:
# ESLint errors still block the commit
# Husky hooks run and enforce quality standards
# Commit fails if checks don't pass
```

### With Command Wrapper (Extra Layer):
```bash
$ git commit --no-verify -m "Skip checks"

# ❌ Result:
# ⛔ ============================================
# ⛔ ACCESS DENIED: --no-verify is BLOCKED
# ⛔ ============================================
#
# ❌ You attempted to use --no-verify to skip pre-commit checks.
#
# ✋ This project enforces code quality standards:
#    • ESLint validation
#    • TypeScript type checking
#    • Commit message validation
#
# [Instructions to fix and retry]
```

---

## What Gets Checked?

### Pre-Commit Validation
- ✅ ESLint on all staged `.js`, `.jsx`, `.ts`, `.tsx` files in `src/`
- ✅ TypeScript type checking on staged `.ts`, `.tsx` files
- ✅ Maximum warnings set to 0 (matches CI)

### Commit Message Validation
- ✅ Message is not empty
- ✅ Message is at least 10 characters
- ⚠️ Recommended format: `feat:`, `fix:`, `refactor:`, etc.

---

## How to Fix and Commit Properly

If pre-commit checks fail:

```bash
# 1. Fix ESLint errors
npm run lint:fix

# 2. Check TypeScript errors
npm run typecheck

# 3. Fix any remaining issues manually

# 4. Stage your changes
git add .

# 5. Try committing again (WITHOUT --no-verify)
git commit -m "feat: your descriptive message"

# ✅ Commit succeeds if all checks pass
```

---

## Permanent Disable (Emergency Only)

If you absolutely must disable hooks for a specific session:

```bash
# Temporarily disable all hooks
cd steelapp-fe
npm uninstall husky  # This removes hooks

# Make your changes and commit
git commit -m "Emergency commit"

# Re-enable hooks
npm install  # Reinstalls husky hooks
```

⚠️ **Warning:** This should only be done in genuine emergencies. Team leads should be notified.

---

## Environment Variables

You can configure hook behavior:

```bash
# Skip only ESLint (TypeScript still runs)
HUSKY=0 git commit -m "Skip hooks"  # This WILL be blocked if wrapper is active

# Better approach: Fix the actual issue instead
npm run lint:fix
git add .
git commit -m "fix: resolved linting errors"
```

---

## For Team Leads / Administrators

### Enforce the Wrapper Fleet-Wide

To ensure ALL developers use the command wrapper:

**Option 1: Git Config (Per User)**
```bash
git config core.hooksPath .husky
```

**Option 2: Add to Project Documentation**
Add this to your `README.md`:
```markdown
### Setup Git Hooks
Everyone should set up the git wrapper to prevent bypassing checks:
\`\`\`bash
source ./scripts/git-alias.sh
\`\`\`
```

**Option 3: Onboarding Script**
Create `scripts/onboard-developer.sh`:
```bash
#!/bin/bash
echo "Setting up git hooks..."
source ./scripts/git-alias.sh
echo "✅ Git hooks configured!"
```

---

## Verification

To verify hooks are working:

```bash
# 1. Check husky is installed
npm list husky

# 2. Check hooks exist
ls -la .husky/

# 3. Test: Try to commit something intentionally bad
echo "console.log('bad')" > src/test-bad.js
git add src/test-bad.js
git commit -m "test"

# Expected: Commit fails with ESLint error
# Then clean up:
rm src/test-bad.js
git reset HEAD src/test-bad.js
```

---

## Troubleshooting

### Hooks Not Running?
```bash
# Reinstall husky
npm uninstall husky
npm install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Command Wrapper Not Blocking?
```bash
# Check if alias is active
alias git  # Should show the wrapper path

# If not active, run:
source /path/to/steelapp-fe/scripts/git-alias.sh

# Make it permanent by adding to ~/.bashrc, ~/.zshrc, etc.
```

### Pre-Commit Passes Locally but Fails in CI?
- CI runs `npm run lint:ci` which is stricter (--max-warnings=0)
- Run locally: `npm run lint:ci`
- Fix any remaining issues
- Try committing again

---

## FAQ

**Q: Can I use `--no-verify` to skip checks?**
A: No. Husky hooks cannot be bypassed this way. If you added the command wrapper, `--no-verify` is blocked at the command level too.

**Q: What if I have a legitimate reason to skip checks?**
A: Contact your tech lead. They can approve emergency procedures, but it requires explicit authorization and should be logged.

**Q: Does this work with GitHub Desktop / GitKraken?**
A: Yes! All Git GUIs respect Husky hooks. They run the same pre-commit checks.

**Q: Can I temporarily disable hooks?**
A: Yes, but it requires uninstalling and reinstalling Husky, which is not subtle and is tracked.

**Q: What if my IDE is running lint automatically?**
A: Great! Fix the issues in your IDE, then stage and commit normally.

---

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Project Code Standards](.eslintrc.cjs)

---

**Status:** ✅ Anti-bypass hooks are now ACTIVE
**Last Updated:** January 29, 2026
