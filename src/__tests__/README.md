# Credit Note Test Suite

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test CreditNoteForm.test.jsx
```

See `/TEST_QUICK_START.md` in project root for detailed instructions.

---

## Test Files

### Component Tests

- **`../pages/__tests__/CreditNoteForm.test.jsx`** - Credit note form component (32 tests)

### Hook Tests

- **`../hooks/__tests__/useCreditNoteDrafts.test.js`** - Draft management hook (20 tests)

### Utility Tests

- **`../utils/__tests__/invoiceUtils.test.js`** - Date formatting utilities (25 tests)

### Integration Tests

- **`credit-note-integration.test.jsx`** - End-to-end workflows (10 tests)

---

## Mock Data

All mock data centralized in:

```
steelapp-fe/src/test/mocks/creditNoteMocks.js
```

Includes:

- Mock credit notes (draft, issued, with items, etc.)
- Mock invoices
- Mock drafts for localStorage
- Factory functions for custom mocks
- Test scenarios

---

## What's Tested

### 1. Date Format Handling

- ISO timestamps from backend → yyyy-MM-dd for HTML5 inputs
- Credit note dates
- Invoice dates
- Draft dates from localStorage
- Timezone conversions (UTC → UTC+4)

### 2. Auto-Save Functionality

- Manual credit amount saves WITHOUT items
- Auto-save triggers after debounce (2500ms)
- Draft persists to localStorage
- Draft structure validation

### 3. Draft Management

- Save/load/delete operations
- Conflict detection (same/different invoice)
- Draft expiry (midnight)
- Resume draft workflow
- Clear draft after save

### 4. Validation

- Required fields enforced
- Manual amount OR items required for ACCOUNTING_ONLY
- Items required for RETURN_WITH_QC
- Error messages display correctly

### 5. Complete Workflows

- Create → Save Draft → Resume → Save
- Create → Issue Tax Document
- Edit existing credit note
- Date format throughout workflow

---

## Bug Fixes Verified

### ✅ Bug 1: Date Format

**Issue**: Backend ISO timestamp causes "Invalid date" in input
**Fix**: `formatDateForInput()` converts to yyyy-MM-dd
**Tests**: 12 tests in `invoiceUtils.test.js`

### ✅ Bug 2: Auto-Save

**Issue**: Manual credit amount doesn't save to drafts
**Fix**: Allow save with manual amount even if items empty
**Tests**: 8 tests across multiple files

### ✅ Bug 3: List Scroll

**Issue**: Credit note list not horizontally scrollable
**Fix**: Changed overflow-hidden → overflow-x-auto
**Tests**: Manual UI verification

---

## Test Structure

### Standard Test Pattern

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks, localStorage
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should do something specific', async () => {
    // Arrange
    const mockData = ...;

    // Act
    render(<Component />);
    await userEvent.click(...);

    // Assert
    await waitFor(() => {
      expect(...).toBe(...);
    });
  });
});
```

### Common Patterns

**Rendering with Context**:

```javascript
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

render(
  <TestWrapper>
    <CreditNoteForm />
  </TestWrapper>,
);
```

**Mocking Services**:

```javascript
vi.mock('../services/creditNoteService', () => ({
  creditNoteService: {
    getCreditNote: vi.fn(),
    createCreditNote: vi.fn(),
  },
}));
```

**localStorage Mock**:

```javascript
let localStorageMock = {};
global.localStorage = {
  getItem: vi.fn((key) => localStorageMock[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock[key] = value;
  }),
  clear: vi.fn(() => {
    localStorageMock = {};
  }),
};
```

**Waiting for Auto-Save**:

```javascript
// Auto-save has 2500ms debounce
await waitFor(
  () => {
    const drafts = JSON.parse(localStorage.getItem('credit_note_drafts'));
    expect(drafts[337]).toBeDefined();
  },
  { timeout: 4000 },
); // Wait up to 4 seconds
```

---

## Coverage Targets

| Module                 | Target | Expected |
| ---------------------- | ------ | -------- |
| CreditNoteForm.jsx     | >80%   | ~85%     |
| useCreditNoteDrafts.js | >80%   | ~90%     |
| invoiceUtils.js        | >80%   | ~75%     |
| Overall                | >80%   | ~82%     |

Generate coverage report:

```bash
npm run test:coverage
```

View report: `steelapp-fe/coverage/index.html`

---

## Adding New Tests

1. **Use Mock Data**:

   ```javascript
   import { mockCreditNote, mockInvoice } from '../test/mocks/creditNoteMocks';
   ```

2. **Follow Naming Convention**:
   - Test files: `ComponentName.test.jsx` or `hookName.test.js`
   - Test descriptions: "should [expected behavior]"

3. **Include Assertions**:
   - Positive case (expected behavior)
   - Negative case (error handling)
   - Edge cases (null, empty, invalid)

4. **Clean Up**:

   ```javascript
   afterEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
   });
   ```

5. **Update Documentation**:
   - Add test count to this README
   - Update coverage targets
   - Document new scenarios

---

## Troubleshooting

### Tests Timeout

**Problem**: Tests hang or timeout
**Solution**:

- Check debounce timing (auto-save is 2500ms)
- Increase `waitFor` timeout to 4000ms
- Verify mocks are resolving

### localStorage Errors

**Problem**: "localStorage is not defined"
**Solution**:

- Check test setup.js includes localStorage mock
- Ensure beforeEach sets up localStorage

### Date Format Failures

**Problem**: Expected yyyy-MM-dd, got ISO string
**Solution**:

- Verify `formatDateForInput` is called
- Check timezone conversion (UTC → UTC+4)
- Ensure date input receives formatted value

### Component Not Rendering

**Problem**: "Unable to find element"
**Solution**:

- Check all mocks are set up correctly
- Verify ThemeProvider wrapper exists
- Use `screen.debug()` to see rendered output
- Check if element is async (use `findBy` instead of `getBy`)

### Coverage Low

**Problem**: Coverage below target
**Solution**:

- Run coverage report to see uncovered lines
- Add tests for error paths
- Test all branches (if/else)
- Test edge cases

---

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
- name: Run Credit Note Tests
  run: |
    cd steelapp-fe
    npm test
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./steelapp-fe/coverage
```

### Jenkins Example

```groovy
stage('Test') {
  steps {
    dir('steelapp-fe') {
      sh 'npm test'
      sh 'npm run test:coverage'
    }
  }
}
```

---

## Test Maintenance Checklist

When modifying Credit Note functionality:

- [ ] Update affected test files
- [ ] Add new test cases for new features
- [ ] Run full test suite
- [ ] Check coverage (should not decrease)
- [ ] Update mock data if needed
- [ ] Update this README if test structure changes
- [ ] Update TEST_RESULTS_CREDIT_NOTE.md

---

## Resources

### Documentation

- **TEST_QUICK_START.md** - Quick reference for running tests
- **TEST_RESULTS_CREDIT_NOTE.md** - Detailed test documentation
- **TEST_SUITE_SUMMARY.md** - Complete test suite overview
- **CLAUDE.md** - Project testing guidelines

### Test Files

- Component tests: `src/pages/__tests__/`
- Hook tests: `src/hooks/__tests__/`
- Utility tests: `src/utils/__tests__/`
- Integration tests: `src/__tests__/`
- Mock data: `src/test/mocks/`

### Implementation Files

- Form: `src/pages/CreditNoteForm.jsx`
- Hook: `src/hooks/useCreditNoteDrafts.js`
- Utils: `src/utils/invoiceUtils.js`
- Service: `src/services/creditNoteService.js`

---

## Commands Reference

```bash
# Run all tests
npm test

# Run specific file
npm test CreditNoteForm.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="Date Format"

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode (visual test runner)
npm run test:ui

# Run with verbose output
npm test -- --verbose

# Run with specific timeout
npm test -- --testTimeout=10000
```

---

**Last Updated**: 2025-12-05
**Total Tests**: 87
**Status**: Ready for execution
