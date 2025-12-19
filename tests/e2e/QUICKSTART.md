# E2E Tests - Quick Start Guide

## 30 Seconds to Running Tests

### Prerequisites Check

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
bash tests/e2e/verify-setup.sh
```

If all green, skip to "Run Tests". If yellow warnings, follow the instructions.

### Install (One-Time)

```bash
# Install Chromium if not done
npx @puppeteer/browsers install chromium@latest --platform=linux
```

### Start Services (Terminal 1)

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
npm run dev
```

### Start Backend (Terminal 2)

```bash
cd /mnt/d/Ultimate\ Steel/backend
npm run dev
```

### Run Tests (Terminal 3)

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
node tests/e2e/supplier-form.test.js
```

## What Gets Tested

1. **Basic Form Creation** - Required fields, form submission
2. **All Fields** - 30+ fields across 7 sections
3. **VAT Validation** - Format checking
4. **TRN Validation** - 15-digit format
5. **Date Validation** - Trade license expiry
6. **Location Logic** - Auto-update lead times and fields
7. **UI Behavior** - Accordion expand/collapse

## Expected Result

```
✓ PASS  Basic Supplier Creation
✓ PASS  Full Supplier Creation
✓ PASS  VAT Number Validation
✓ PASS  TRN Number Validation
✓ PASS  Trade License Expiry
✓ PASS  Supplier Location Change
✓ PASS  Accordion Behavior

Passed: 7 | Failed: 0 | Total: 7
```

## Troubleshooting

### "Chrome executable not found"

```bash
npx @puppeteer/browsers install chromium@latest --platform=linux
```

### "Cannot connect to localhost:5173"

Frontend not running - start it in Terminal 1:

```bash
npm run dev
```

### "Cannot connect to localhost:3000"

Backend not running - start it in Terminal 2:

```bash
cd /mnt/d/Ultimate\ Steel/backend
npm run dev
```

### "Form fields not found"

Check browser console for errors:

1. Take screenshot: Add to test file
2. Enable logging: Check puppeteer-utils.js
3. Compare selectors with actual form

## Documentation

- **Detailed guide:** `tests/e2e/SUPPLIER_FORM_TESTS.md`
- **API reference:** `tests/e2e/README.md`
- **Architecture:** `tests/e2e/IMPLEMENTATION_SUMMARY.md`

## Adding More Tests

See `tests/e2e/README.md` section "Writing New Tests" for template.

## Need Help?

1. Run verification: `bash tests/e2e/verify-setup.sh`
2. Check logs and error messages
3. Review detailed docs
4. Enable debug logging in test file
