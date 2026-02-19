# Testing Guide for Data Display & Tables Components

## Quick Start

### Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version

# Install dependencies
npm install
```

### Running Tests

```bash
# Run all component tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
node --test src/components/shared/__tests__/DataTable.test.mjs

# Run multiple test files
node --test 'src/components/shared/__tests__/*.test.mjs'
```

## Test Structure

Each test file follows this pattern:

```javascript
import test from 'node:test';
import assert from 'node:assert';
import { mockData, helpers } from './test-utils.mjs';

test('Component - Feature area', async (t) => {
  await t.test('specific behavior 1', () => {
    // arrange
    const data = mockData();

    // act
    const result = processData(data);

    // assert
    assert.ok(result);
  });

  await t.test('specific behavior 2', () => {
    // test implementation
  });
});
```

## Test Categories by Risk Area

### Critical Financial Data (High Risk)
- **DataTable.test.mjs** - Invoice/payment sorting, filtering, display
- **Card.test.mjs** - Currency formatting, status display
- **PropertyTable.test.mjs** - Financial property editing
- **Timeline.test.mjs** - Payment event tracking

**Run:** `node --test src/components/shared/__tests__/{DataTable,Card,PropertyTable,Timeline}.test.mjs`

### User Interaction & Navigation (Medium Risk)
- **TableHeader.test.mjs** - Sort controls, header state
- **TableRow.test.mjs** - Selection, expansion, actions
- **FilteredList.test.mjs** - Search, filter UI
- **EmptyState.test.mjs** - Error messaging

**Run:** `node --test src/components/shared/__tests__/{TableHeader,TableRow,FilteredList,EmptyState}.test.mjs`

### Application Stability (High Risk)
- **LoadingState.test.mjs** - Loading UI and timeouts
- **ErrorBoundary.test.mjs** - Error recovery

**Run:** `node --test src/components/shared/__tests__/{LoadingState,ErrorBoundary}.test.mjs`

## Multi-Tenancy Testing

All tests include company_id filtering validation:

```javascript
// Example: Verify data isolation per company
const filtered = mockInvoices.filter(inv => inv.companyId === 'COMP-001');
assert.ok(filtered.length > 0);

// Example: Ensure no cross-company data
const otherCompany = mockInvoices.filter(inv => inv.companyId !== 'COMP-001');
assert.equal(otherCompany.length, 0); // Mock only contains COMP-001 data
```

When integrating with real backend, ensure:
1. All API queries filter by tenant context
2. No sensitive data visible across company boundaries
3. API gateway validates company_id in headers

## Keyboard Navigation Testing

Tests cover these essential keyboard shortcuts:

| Key | Action | Tested In |
|-----|--------|-----------|
| Tab | Navigate to next element | All components |
| Shift+Tab | Navigate to previous element | All components |
| Enter | Select/activate focused item | TableRow, FilteredList |
| Space | Select checkbox or toggle | TableRow, FilteredList |
| Arrow Up/Down | Navigate list items | TableRow, FilteredList, Timeline |
| Arrow Left/Right | Navigate columns | TableHeader |
| Escape | Close menu/modal | FilteredList |
| Ctrl+F | Focus search input | FilteredList |
| Home | Jump to first item | FilteredList, Timeline |
| End | Jump to last item | FilteredList, Timeline |
| Shift+Click | Multi-select rows | TableRow |
| Alt+O | Open action menu | TableRow |

## Accessibility Verification

Tests validate WCAG 2.1 AA compliance:

### Screen Reader Support
- `role="status"` for loading states
- `role="alert"` for errors
- `aria-sort="ascending|descending|none"` for sortable headers
- `aria-busy="true"` for loading
- `aria-label="..."` for interactive elements
- `aria-live="polite"` for dynamic updates

### Color Contrast
- Minimum 4.5:1 ratio for normal text
- Tested in both light and dark modes

### Focus Management
- Visible focus indicators
- Proper focus order (Tab navigation)
- Focus trap in modals (if applicable)

## Dark Mode Testing

Tests verify dark mode styling in 4 areas:

1. **Background Colors**
   - Light: #ffffff, #f9fafb, #f3f4f6
   - Dark: #1f2937, #111827, #0f172a

2. **Text Colors**
   - Light: #1f2937, #374151
   - Dark: #e5e7eb, #d1d5db

3. **Borders & Dividers**
   - Light: #e5e7eb, #d1d5db
   - Dark: #374151, #4b5563

4. **Status Badges** (consistent across modes)
   - Success: #10b981
   - Warning: #f59e0b
   - Error: #ef4444

## Performance Benchmarks

Tests validate performance under load:

| Scenario | Target | Tested |
|----------|--------|--------|
| Large dataset (1000 rows) | Render in <1s | DataTable |
| Search debounce | 300ms delay | FilteredList |
| Skeleton animation | Smooth 60fps | LoadingState |
| Sort operation | <100ms | DataTable |
| Filter application | <200ms | FilteredList |

## Mock Data Availability

All tests use realistic mock data from `test-utils.mjs`:

```javascript
import {
  mockInvoices,           // 3 invoices with different statuses
  mockPayments,           // 2 payment records
  mockInventoryItems,     // 3 inventory items
  mockUsers,              // 2 users with roles
  mockTimelineEvents,     // 3 timeline events
  createMockDataService,  // Data service with CRUD ops
  createMockInvoice,      // Factory function for custom invoices
  createMockPayment,      // Factory function for custom payments
  createMockInventoryItem // Factory function for custom items
} from './test-utils.mjs';
```

## Error Scenarios Tested

Tests cover these error conditions:

| Error | Component | Recovery |
|-------|-----------|----------|
| Network timeout | DataTable | Retry button |
| Invalid data | PropertyTable | Validation message |
| Component crash | ErrorBoundary | Reset/retry |
| Permission denied | EmptyState | Message + support link |
| No results | FilteredList | "No results" message |
| Loading timeout | LoadingState | "Taking longer..." message |

## Running Tests in CI/CD

For GitHub Actions or similar CI systems:

```yaml
- name: Run component tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Test Naming Convention

Tests follow this naming pattern:

```
ComponentName - Feature Area
  ✓ specific observable behavior
  ✓ another observable behavior
```

Example:
```
DataTable - Rendering with sample data
  ✓ renders table with invoice data
  ✓ displays all columns correctly
  ✓ renders correct number of rows
  ✓ displays row data with proper formatting
```

## Debugging Failed Tests

### Verbose Output
```bash
node --test --reporter=verbose src/components/shared/__tests__/DataTable.test.mjs
```

### Single Test
```bash
# Modify test file to use only() to isolate
test.only('Single test', () => { ... })
```

### Add Debugging
```javascript
import { debug } from 'util';

test('Debug test', () => {
  const data = mockInvoices[0];
  console.log('Data:', debug(data));
  assert.ok(data);
});
```

## Integration with Components

When implementing components, ensure:

1. **Props Match Tests**
   ```javascript
   // Component receives these props
   <DataTable
     data={mockInvoices}
     onSort={(field, order) => {}}
     onFilter={(criteria) => {}}
     onPageChange={(page) => {}}
   />
   ```

2. **Events Match Tests**
   ```javascript
   // Component emits these events
   onClick, onSort, onFilter, onSelect, onExpand
   ```

3. **Attributes Match Tests**
   ```javascript
   // Component has these ARIA attributes
   aria-sort, aria-busy, aria-label, role
   ```

4. **Styling Matches Tests**
   ```javascript
   // Component supports dark mode
   className={isDarkMode ? 'dark' : ''}
   ```

## Test Coverage Goals

Target coverage for this component suite:

| Metric | Target | Status |
|--------|--------|--------|
| Statements | 85% | Tracked |
| Branches | 80% | Tracked |
| Functions | 85% | Tracked |
| Lines | 85% | Tracked |

Run coverage report:
```bash
npm run test:coverage
```

## Adding New Tests

1. Create new test file: `Component.test.mjs`
2. Import utilities: `import { mockData, helpers } from './test-utils.mjs'`
3. Follow test structure with descriptive names
4. Include at least 10 test cases
5. Cover accessibility, dark mode, responsive behavior
6. Test multi-tenancy with company_id filtering

Template:
```javascript
import test from 'node:test';
import assert from 'node:assert';
import { mockData, createMockDataService } from './test-utils.mjs';

test('ComponentName - Feature area', async (t) => {
  await t.test('renders correctly', () => {
    assert.ok(mockData);
  });

  await t.test('handles interactions', () => {
    const service = createMockDataService();
    assert.ok(service);
  });

  // Add more test cases...
});
```

## Troubleshooting

### Tests not running
```bash
# Ensure file extension is .test.mjs
# Ensure Node.js version is 18+
node --version

# Try explicit path
node --test ./src/components/shared/__tests__/DataTable.test.mjs
```

### Import errors
```bash
# Ensure test-utils.mjs is in same directory
# Use relative imports: './test-utils.mjs'
# Not: '@/test-utils' (path aliases not supported)
```

### Assertion failures
- Add console.log for debugging
- Check mock data matches expected structure
- Verify test logic against component behavior

## Resources

- **Node Test Runner:** https://nodejs.org/docs/latest/api/test.html
- **Assert Module:** https://nodejs.org/docs/latest/api/assert.html
- **Testing Library Docs:** https://testing-library.com/
- **WCAG Accessibility:** https://www.w3.org/WAI/WCAG21/quickref/
- **Keyboard Navigation:** https://www.w3.org/WAI/test-evaluate/preliminary/

## Contact

For questions about tests or components:
1. Check component-specific README in test files
2. Review test-utils.mjs for available helpers
3. Check project CLAUDE.md for architecture details
