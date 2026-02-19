# Test Reference - Tier 2 Overlays

Quick reference guide for the comprehensive test suite covering Modal, Drawer, and Overlay components.

## Files Created

### Test Files (9 files, 415+ tests)
1. **Modal.test.js** (40+ tests)
2. **ConfirmDialog.test.js** (50+ tests)
3. **AlertDialog.test.js** (45+ tests)
4. **Drawer.test.js** (50+ tests)
5. **Popover.test.js** (40+ tests)
6. **Dropdown.test.js** (55+ tests)
7. **Toast.test.js** (50+ tests)
8. **Tooltip.test.js** (40+ tests)
9. **ContextMenu.test.js** (45+ tests)

### Documentation Files (3 files)
1. **TIER2_OVERLAYS_TEST_SUMMARY.md** - Complete inventory of all tests
2. **IMPLEMENTATION_GUIDE.md** - How to implement components
3. **TEST_REFERENCE.md** - This file

## Location

All files in:
```
/mnt/d/Ultimate Steel/steelapp-fe/src/components/shared/__tests__/
```

## Running Tests

```bash
# All tests
npm test

# Single file
npm test Modal.test.js

# Watch mode
npm test:watch

# Coverage
npm run test:coverage
```

## Test Coverage by Component

### Modal (40+ tests)
- Render/hide behavior
- Backdrop click handling
- Focus management
- Scroll lock
- Z-index stacking
- Dark mode support

### ConfirmDialog (50+ tests)
- Confirm/cancel buttons
- Loading state
- Dangerous action styling
- Button ordering
- Accessibility

### AlertDialog (45+ tests)
- Alert types (4 variants)
- Auto-dismiss
- Icons and colors
- Progress bar
- Screen reader support

### Drawer (50+ tests)
- Position variants (4 positions)
- Slide animations
- Scroll behavior
- Custom sizing
- Header with close button

### Popover (40+ tests)
- Positioning (4 positions)
- Arrow placement
- Click outside handling
- Trigger accessibility
- Focus management

### Dropdown (55+ tests)
- Item selection
- Disabled items
- Icons and badges
- Keyboard navigation
- Multiple dropdowns

### Toast (50+ tests)
- Auto-dismiss
- Position variants
- Progress animation
- Action buttons
- Multiple toasts

### Tooltip (40+ tests)
- Hover show/hide
- Delay configuration
- Position variants
- Text wrapping
- Timeout cleanup

### ContextMenu (45+ tests)
- Right-click behavior
- Cursor positioning
- Item selection
- Click outside
- Disabled items

## Key Test Patterns

### Show/Hide Pattern
```javascript
it("should render when isOpen is true", () => {
  const { getByTestId } = renderWithProviders(
    <Component isOpen={true} />
  );
  expect(getByTestId("component")).toBeInTheDocument();
});

it("should not render when isOpen is false", () => {
  const { queryByTestId } = renderWithProviders(
    <Component isOpen={false} />
  );
  expect(queryByTestId("component")).not.toBeInTheDocument();
});
```

### Event Handling Pattern
```javascript
it("should call callback on action", async () => {
  const user = setupUser();
  const mockCallback = vi.fn();
  const { getByTestId } = renderWithProviders(
    <Component onClick={mockCallback} />
  );

  await user.click(getByTestId("button"));
  expect(mockCallback).toHaveBeenCalled();
});
```

### Accessibility Pattern
```javascript
it("should have proper ARIA attributes", () => {
  const { getByTestId } = renderWithProviders(<Component />);
  expect(getByTestId("component")).toHaveAttribute("role", "dialog");
  expect(getByTestId("component")).toHaveAttribute("aria-modal", "true");
});
```

### Styling Pattern
```javascript
it("should apply correct styling", () => {
  const { getByTestId } = renderWithProviders(
    <Component type="error" />
  );
  expect(getByTestId("component").className).toContain("bg-red");
});
```

### Timer Pattern
```javascript
it("should auto-dismiss after duration", () => {
  vi.useFakeTimers();
  renderWithProviders(<Toast duration={3000} onClose={mockCallback} />);
  vi.advanceTimersByTime(3000);
  expect(mockCallback).toHaveBeenCalled();
  vi.useRealTimers();
});
```

## Test Data Examples

### Modal Props
```javascript
{
  isOpen: true,
  onClose: vi.fn(),
  children: <div>Content</div>
}
```

### ConfirmDialog Props
```javascript
{
  isOpen: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  title: "Confirm Action",
  message: "Are you sure?",
  isDangerous: true,
  isLoading: false
}
```

### Dropdown Items
```javascript
[
  { label: "Option 1", value: "opt1" },
  { label: "Option 2", value: "opt2", icon: "✏️" },
  { label: "Option 3", value: "opt3", badge: "5", disabled: true }
]
```

## Assertions

### Visibility
```javascript
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(queryByTestId("element")).not.toBeInTheDocument()
```

### Attributes
```javascript
expect(element).toHaveAttribute("role", "dialog")
expect(element).toHaveAttribute("aria-modal", "true")
expect(element.className).toContain("z-50")
```

### State
```javascript
expect(element).toBeDisabled()
expect(element).not.toBeDisabled()
expect(mockCallback).toHaveBeenCalled()
expect(mockCallback).toHaveBeenCalledWith(expectedArg)
```

## Utilities

From `component-setup.js`:
- `renderWithProviders()` - Render with providers
- `setupUser()` - User event helper
- `createMockProps()` - Props factory
- `vi.fn()` - Mock function

From `@testing-library/react`:
- `getByTestId()` - Find by test ID
- `queryByTestId()` - Find (optional)
- `getByText()` - Find by text
- `getByRole()` - Find by role

## Coverage Checklist

Before considering a test complete:

- [ ] Tests run: `npm test Component.test.js`
- [ ] All assertions pass
- [ ] Accessibility checks included
- [ ] Event handling tested
- [ ] Edge cases covered
- [ ] Dark mode tested
- [ ] Z-index verified
- [ ] Cleanup verified

## Common Commands

```bash
# Run all tests
npm test

# Run one file
npm test Modal.test.js

# Run with pattern
npm test -- --grep "should render"

# Watch mode
npm test:watch

# Coverage report
npm run test:coverage

# Lint before commit
npm run lint:fix

# Type check
npm run typecheck
```

## Debugging

### See rendered HTML
```javascript
const { debug } = renderWithProviders(<Component />);
debug();
```

### Check element exists
```javascript
const element = container.querySelector('[data-testid="id"]');
console.log(element ? "Found" : "Not found");
```

### Log mock calls
```javascript
const mockFn = vi.fn();
// ... use mockFn ...
console.log(mockFn.mock.calls); // All calls
console.log(mockFn.mock.calls[0][0]); // First call, first arg
```

### Wait for element
```javascript
await waitFor(() => {
  expect(getByTestId("element")).toBeInTheDocument();
});
```

## Test Statistics

| Component | Tests | Lines | Categories |
|-----------|-------|-------|------------|
| Modal | 40+ | 450+ | 9 |
| ConfirmDialog | 50+ | 550+ | 11 |
| AlertDialog | 45+ | 500+ | 10 |
| Drawer | 50+ | 550+ | 11 |
| Popover | 40+ | 450+ | 9 |
| Dropdown | 55+ | 600+ | 11 |
| Toast | 50+ | 550+ | 10 |
| Tooltip | 40+ | 450+ | 9 |
| ContextMenu | 45+ | 500+ | 10 |
| **Total** | **415+** | **5000+** | **90+** |

## Documentation Cross-Reference

- **Test Inventory**: TIER2_OVERLAYS_TEST_SUMMARY.md
- **Implementation**: IMPLEMENTATION_GUIDE.md
- **Quick Commands**: This file
- **All Tests**: Individual .test.js files

## Notes

- Tests use Vitest (Node native test runner)
- All components have mock implementations
- Focus on behavior, not implementation
- Accessibility built into every test
- Ready for real component integration

---

**Created**: 2026-02-04
**Total Test Files**: 9
**Total Tests**: 415+
**Status**: Complete
