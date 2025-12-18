# Form Validation Tests

Automated browser tests for the 4 migrated forms (Material-UI → Tailwind CSS).

## Forms Tested

1. **Account Statement Form** - Enhanced account statements with multi-currency support
2. **Add Payment Form** - Payment recording with invoice allocation
3. **Reservation Form** - Stock reservations with expiry tracking
4. **Transfer Form** - Inter-warehouse transfers with multi-item table

## Prerequisites

**Frontend server MUST be running** on `http://localhost:5173` before running tests.

```bash
# Start the frontend server (in a separate terminal)
npm run dev
```

## Running Tests

### Run All Form Tests
```bash
npm run test:forms
```

### Run Individual Form Tests
```bash
npm run test:form:account-statement  # Account Statement Form
npm run test:form:payment            # Add Payment Form
npm run test:form:reservation        # Reservation Form
npm run test:form:transfer           # Transfer Form
```

## What Gets Tested

Each test validates:

### ✓ Page Load
- Form loads without errors
- All expected elements are present

### ✓ Form Fields
- Input fields (text, number, date)
- Select dropdowns
- Textareas
- Autocomplete components

### ✓ Interactions
- Typing into fields
- Selecting from dropdowns
- Product autocomplete with search
- Adding/removing table rows (Transfer Form)
- Dark mode toggle (if available)

### ✓ Validation
- Required field validation
- Format validation
- Business rule validation (e.g., same warehouse prevention)

### ✓ Error Checking
- Console errors
- Page errors (JavaScript exceptions)
- Network errors

### ✓ Visual Regression
- Screenshots at each test stage
- Dark mode screenshots
- Validation error screenshots

## Test Results

### Screenshots
Located in `test-results/screenshots/`
- `{form}-01-loaded.png` - Initial page load
- `{form}-02-*.png` - Form interactions
- `{form}-03-*.png` - Autocomplete/dropdowns
- `{form}-04-validation.png` - Validation errors

### JSON Report
Located in `test-results/test-results.json`
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": 45.23,
  "total": 4,
  "passed": 4,
  "failed": 0,
  "tests": [...]
}
```

## Test Configuration

Each test uses Puppeteer with:
- **Headless mode**: `true` (set to `false` to watch tests run)
- **Slow motion**: 50ms between actions
- **Timeout**: 30 seconds per operation
- **Viewport**: 1920x1080

## Troubleshooting

### Test Fails Immediately
**Issue**: `ERR_CONNECTION_REFUSED` or page load timeout
**Solution**: Ensure frontend server is running on port 5173

### Autocomplete Not Working
**Issue**: Dropdown doesn't appear or selections fail
**Solution**: Check network tab for API errors, verify backend is running

### Screenshots Not Saved
**Issue**: Permission denied or directory not found
**Solution**: Ensure `test-results/screenshots/` directory exists

### Console Errors Detected
**Issue**: React warnings or errors in console
**Solution**: Check the specific error message, may not be critical

## Debugging Tests

To see the browser during tests:

1. Edit the test file
2. Change `headless: true` to `headless: false`
3. Increase `slowMo: 50` to `slowMo: 500` for slower playback
4. Run the individual test

```javascript
const TEST_CONFIG = {
  headless: false,  // Show browser
  slowMo: 500,      // 500ms between actions
  timeout: 30000,
};
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Form Validation Tests
  run: |
    npm run dev &  # Start server in background
    sleep 5        # Wait for server to start
    npm run test:forms
    kill %1        # Stop server
```

## Coverage

| Form | Load | Fields | Autocomplete | Validation | Dark Mode |
|------|------|--------|--------------|------------|-----------|
| Account Statement | ✓ | ✓ | - | ✓ | ✓ |
| Add Payment | ✓ | ✓ | ✓ | ✓ | - |
| Reservation | ✓ | ✓ | ✓ | ✓ | - |
| Transfer | ✓ | ✓ | ✓ | ✓ | - |

## Next Steps

After all tests pass:
1. Review screenshots for visual correctness
2. Check JSON report for warnings
3. Proceed to Phase 2b (Field Enhancement Project)
4. Extract reusable components
5. Performance optimization
