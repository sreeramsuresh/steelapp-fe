# Button Testing Patterns

A comprehensive guide to testing buttons in React components using React Testing Library and button test utilities.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Core Principles](#core-principles)
- [Pattern 1: Form Submission](#pattern-1-form-submission)
- [Pattern 2: Modal Triggers](#pattern-2-modal-triggers)
- [Pattern 3: Confirmation Dialogs](#pattern-3-confirmation-dialogs)
- [Pattern 4: Async Operations](#pattern-4-async-operations)
- [Pattern 5: Conditional Buttons](#pattern-5-conditional-buttons)
- [Edge Cases](#edge-cases)
- [Common Pitfalls](#common-pitfalls)

---

## Quick Reference

```javascript
import {
  findButtonByRole,
  clickButton,
  clickAndWait,
  assertButtonEnabled,
  assertSuccessToast,
  assertModalOpens,
  waitForApiCall,
  waitForLoadingComplete,
} from '@/test/utils';

// Basic pattern: Find, click, assert state change
it('button causes observable state change', async () => {
  render(<Component />);
  const button = findButtonByRole('Save');
  await assertButtonEnabled(button);

  await clickAndWait(button, {
    waitFor: () => assertSuccessToast(/saved/i),
  });
});
```

---

## Core Principles

Every button test MUST follow these principles:

### 1. Every Button Must Have At Least One Test

Each button should have a test verifying its enabled click path.

```javascript
// ✅ GOOD: Button has test
it('Delete button causes list item removal', async () => {
  render(<ItemList items={[{ id: 1, name: 'Item' }]} />);
  await clickButton(findButtonByRole('Delete'));
  await assertListItemRemoved(/Item/i);
});

// ❌ BAD: Button with no test
// (implicitly assumes button works without verification)
```

### 2. Assert Observable State Changes

After clicking, verify something changed in the DOM (not just mock function calls).

```javascript
// ✅ GOOD: Observable state change
await clickAndWait(button, {
  waitFor: () => assertSuccessToast(/saved/i),
});

// ✅ ALSO GOOD: Data visible in list
await assertListItemAdded(/New Item/i);

// ❌ AVOID: Only mocking, no observable change
// (Doesn't verify UI actually updated)
mockSubmit.mockResolvedValue({});
await clickButton(button);
expect(mockSubmit).toHaveBeenCalled(); // Weak assertion
```

### 3. Use Semantic Queries

Always prefer `getByRole` for accessibility and robustness.

```javascript
// ✅ GOOD: Semantic role query
const button = findButtonByRole('Save Draft');

// ✅ ALSO OK: Data-testid as fallback
const button = screen.getByTestId('save-button');

// ❌ AVOID: CSS selectors
// (brittle, accessibility blind)
const button = screen.getByTestId('btn-save-draft');
```

### 4. Test Both Success and Error Paths

Cover happy path AND failure scenarios for async operations.

```javascript
// ✅ GOOD: Test both outcomes
it('Delete button removes item on success', async () => {
  const mockDelete = vi.fn().mockResolvedValue({});
  // ... test success path
});

it('Delete button shows error on failure', async () => {
  const mockDelete = vi.fn().mockRejectedValue(new Error('Network error'));
  // ... test error path
});
```

---

## Pattern 1: Form Submission

Testing buttons inside forms (type="submit" or onClick inside form).

### Basic Form Submission

```javascript
it('Save button submits form and shows success', async () => {
  const mockSave = vi.fn().mockResolvedValue({ id: 1 });

  render(<InvoiceForm onSave={mockSave} />);

  // Fill required fields
  await userEvent.type(screen.getByLabelText('Amount'), '500');

  // Find and click submit
  const saveButton = findButtonByRole('Save');
  await assertButtonEnabled(saveButton);

  await clickAndWait(saveButton, {
    waitFor: () => assertSuccessToast(/saved successfully/i),
  });

  // Verify API was called
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: 500,
    }),
  );
});
```

### Form Validation with Disabled State

```javascript
it('Submit button disabled until form valid', async () => {
  render(<CustomerForm />);

  const submitButton = findButtonByRole('Create');

  // Initially disabled
  expect(submitButton).toBeDisabled();

  // Fill fields to make form valid
  await userEvent.type(screen.getByLabelText('Name'), 'ACME Corp');
  await userEvent.type(screen.getByLabelText('Email'), 'info@acme.com');

  // Button should enable
  await waitForButtonEnabled(submitButton);
  expect(submitButton).toBeEnabled();
});
```

### Save Draft Pattern (No Validation)

```javascript
it('Save Draft button persists partial form', async () => {
  render(<CreditNoteForm />);

  // Fill only required field
  await userEvent.type(screen.getByLabelText('Customer'), 'ABC Corp');

  const saveDraftButton = findButtonByRole('Save Draft');

  await clickAndWait(saveDraftButton, {
    waitFor: () => assertSuccessToast(/draft saved/i),
  });

  // Verify localStorage updated
  const saved = JSON.parse(localStorage.getItem('credit_note_drafts'));
  expect(saved).toContainEqual(
    expect.objectContaining({
      customer: 'ABC Corp',
    }),
  );
});
```

---

## Pattern 2: Modal Triggers

Testing buttons that open/close dialogs and modals.

### Open Modal Button

```javascript
it('Add button opens create dialog', async () => {
  render(<CustomerList />);

  const addButton = findButtonByRole('Add Customer');

  await clickAndWait(addButton, {
    waitFor: () => assertModalOpens(/create customer/i),
  });

  // Verify modal content
  const modal = screen.getByRole('dialog');
  expect(within(modal).getByLabelText('Name')).toBeInTheDocument();
});
```

### Close Modal Button

```javascript
it('Cancel button closes dialog without saving', async () => {
  const mockSave = vi.fn();

  render(
    <Modal isOpen={true} onSave={mockSave}>
      <button type="button">Cancel</button>
      <button type="submit">Save</button>
    </Modal>,
  );

  const cancelButton = findButtonByRole('Cancel');

  await clickAndWait(cancelButton, {
    waitFor: () => assertModalCloses(),
  });

  expect(mockSave).not.toHaveBeenCalled();
});
```

### Modal Submission (Save in Modal)

```javascript
it('Modal Save button creates item and closes', async () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: 1 });

  render(
    <Modal isOpen={true} onCreate={mockCreate}>
      <CustomerForm />
    </Modal>,
  );

  // Fill form inside modal
  const modal = screen.getByRole('dialog');
  await userEvent.type(within(modal).getByLabelText('Name'), 'New Customer');

  // Click save
  const saveButton = within(modal).getByRole('button', { name: /save/i });

  await clickAndWait(saveButton, {
    waitFor: () => assertModalCloses(),
  });

  expect(mockCreate).toHaveBeenCalled();
});
```

---

## Pattern 3: Confirmation Dialogs

Testing delete/destructive action confirmations.

### Confirm then Delete

```javascript
it('Delete button triggers confirmation then deletes', async () => {
  const mockDelete = vi.fn().mockResolvedValue({});
  const { confirm } = useConfirm();

  vi.mocked(confirm).mockResolvedValueOnce(true);

  render(
    <ItemList items={[{ id: 1, name: 'Item A' }]} onDelete={mockDelete} />,
  );

  const deleteButton = findButtonByRole('Delete', {
    within: screen.getByText('Item A').closest('tr'),
  });

  await clickAndWait(deleteButton, {
    waitFor: () => assertListItemRemoved(/Item A/i),
  });

  expect(mockDelete).toHaveBeenCalledWith(1);
});
```

### Confirm then Cancel

```javascript
it('Confirmation Cancel prevents deletion', async () => {
  const mockDelete = vi.fn();
  const { confirm } = useConfirm();

  vi.mocked(confirm).mockResolvedValueOnce(false);

  render(<ItemList items={[{ id: 1, name: 'Item' }]} onDelete={mockDelete} />);

  const deleteButton = findButtonByRole('Delete');
  await clickButton(deleteButton);

  // Item should still exist
  expect(screen.getByText('Item')).toBeInTheDocument();
  expect(mockDelete).not.toHaveBeenCalled();
});
```

---

## Pattern 4: Async Operations

Testing buttons that trigger API calls or long-running operations.

### Refresh/Reload Button

```javascript
it('Refresh button reloads data', async () => {
  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce([{ id: 1, name: 'Product A' }])
    .mockResolvedValueOnce([
      { id: 1, name: 'Product A' },
      { id: 2, name: 'Product B' },
    ]);

  render(<ProductList fetchProducts={mockFetch} />);

  // Initial load
  await waitForLoadingComplete();
  expect(screen.getByText('Product A')).toBeInTheDocument();

  // Refresh
  const refreshButton = findButtonByRole('Refresh');

  await performAsyncButtonClick(refreshButton, async () => {
    // Check loading state during operation
    await waitForLoadingStart('[class*="spinner"]');
  });

  // Verify new data loaded
  expect(screen.getByText('Product B')).toBeInTheDocument();
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```

### Button Disabled During Loading

```javascript
it('Submit button disabled while saving', async () => {
  let resolveSubmit;
  const submitPromise = new Promise((resolve) => {
    resolveSubmit = resolve;
  });
  const mockSave = vi.fn().mockReturnValue(submitPromise);

  render(<Form onSave={mockSave} />);

  const submitButton = findButtonByRole('Submit');
  await assertButtonEnabled(submitButton);

  // Click triggers loading
  await userEvent.click(submitButton);

  // Button should be disabled during loading
  await waitForButtonDisabled(submitButton);
  expect(submitButton).toHaveAttribute('disabled');

  // Complete the operation
  resolveSubmit();

  // Button re-enables
  await waitForButtonEnabled(submitButton);
});
```

### Error Handling

```javascript
it('API error shows toast but preserves form', async () => {
  const mockSave = vi.fn().mockRejectedValueOnce(new Error('Network error'));

  render(<Form onSave={mockSave} />);

  const saveButton = findButtonByRole('Save');
  await userEvent.click(saveButton);

  // Error should show as toast
  await assertErrorToast(/failed to save/i);

  // Form data should still be there
  expect(screen.getByLabelText('Amount')).toHaveValue('100');

  // Button should be enabled again for retry
  await waitForButtonEnabled(saveButton);
});
```

---

## Pattern 5: Conditional Buttons

Testing buttons that appear/disappear based on state or permissions.

### Permission-Based Visibility

```javascript
it('Delete button only visible to admins', async () => {
  const { rerender } = render(
    <InvoiceActions permissions={{ canDelete: false }} />,
  );

  expect(
    screen.queryByRole('button', { name: /delete/i }),
  ).not.toBeInTheDocument();

  rerender(<InvoiceActions permissions={{ canDelete: true }} />);

  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});
```

### Status-Based Button States

```javascript
it('Button disabled based on invoice status', async () => {
  const { rerender } = render(<InvoiceActions status="draft" />);

  let issueButton = findButtonByRole('Issue Invoice');
  expect(issueButton).toBeEnabled();

  // After issuing, button should hide
  rerender(<InvoiceActions status="issued" />);

  expect(
    screen.queryByRole('button', { name: /issue invoice/i }),
  ).not.toBeInTheDocument();
});
```

---

## Edge Cases

### Multiple Buttons with Same Text

```javascript
it('Delete correct item from list', async () => {
  render(
    <ItemList
      items={[
        { id: 1, name: 'Item A' },
        { id: 2, name: 'Item B' },
      ]}
    />,
  );

  // Get all delete buttons
  const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

  // Click second row's delete
  await clickButton(deleteButtons[1]);

  // Only Item B should be gone
  expect(screen.getByText('Item A')).toBeInTheDocument();
  expect(screen.queryByText('Item B')).not.toBeInTheDocument();
});
```

### Buttons in Table Rows

```javascript
it('Edit button in correct row', async () => {
  render(<DataTable data={items} />);

  // Find row by content
  const itemARow = screen.getByText('Product A').closest('tr');

  // Find button within that row
  const editButton = within(itemARow).getByRole('button', { name: /edit/i });

  await clickButton(editButton);

  // Should load that specific item
  expect(screen.getByLabelText('Product Name')).toHaveValue('Product A');
});
```

### Disabled vs Hidden

```javascript
it('distinguishes between disabled and hidden', async () => {
  render(<Form canSubmit={false} />);

  // Button exists but disabled
  const submitButton = findButtonByRole('Submit');
  expect(submitButton).toBeDisabled();

  // vs button not rendered at all
  const deleteButton = screen.queryByRole('button', { name: /delete/i });
  expect(deleteButton).not.toBeInTheDocument();
});
```

---

## Common Pitfalls

### ❌ Weak Assertions

```javascript
// BAD: Only checks mock was called, not observable change
await userEvent.click(button);
expect(mockSave).toHaveBeenCalled();

// GOOD: Verify observable state change
await clickAndWait(button, {
  waitFor: () => assertSuccessToast(/saved/i),
});
```

### ❌ Missing Async Handling

```javascript
// BAD: Doesn't wait for async operation
await userEvent.click(button);
expect(screen.getByText(/success/i)).toBeInTheDocument();

// GOOD: Waits for notification
await clickAndWait(button, {
  waitFor: () => assertToastAppears(/success/i),
});
```

### ❌ Brittle Selectors

```javascript
// BAD: CSS selector changes break test
const button = document.querySelector('.btn.btn-primary.btn-lg');

// GOOD: Semantic role query
const button = findButtonByRole('Save');
```

### ❌ Incomplete Coverage

```javascript
// BAD: Only tests happy path
it('saves form', () => {
  /* ... */
});

// GOOD: Tests both success and error
it('saves form on success', () => {
  /* ... */
});
it('shows error on network failure', () => {
  /* ... */
});
it('allows retry after failure', () => {
  /* ... */
});
```

---

## Best Practices Summary

1. **Use semantic queries** - `getByRole` > `getByTestId` > selectors
2. **Assert observable changes** - Check DOM, not just mocks
3. **Wait for async** - Use `waitFor()`, not `setTimeout()`
4. **Test error paths** - Mock rejections, test failure UI
5. **Cover all buttons** - Every button needs at least one test
6. **One button, one test** - Focus on a single button per test
7. **Use test utilities** - Reduces boilerplate, improves clarity
8. **Document intent** - Use clear test descriptions
9. **Avoid flakiness** - Don't rely on timing, use proper waiters
10. **Keep tests simple** - One clear assertion per test when possible

---

## Testing Checklist for New Components

Before marking a component done:

- [ ] Every button has at least one test
- [ ] Each test asserts observable state change
- [ ] Loading states tested (button disabled, text changes)
- [ ] Error paths tested
- [ ] Modal/dialog opening and closing tested
- [ ] Form submission tested
- [ ] API calls verified
- [ ] Toast notifications verified
- [ ] Permission-based visibility tested
- [ ] Conditional rendering tested

---

## Quick Start Template

```javascript
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import {
  findButtonByRole,
  clickAndWait,
  assertSuccessToast,
} from '@/test/utils';

describe('MyComponent Buttons', () => {
  it('Primary action button works correctly', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true });

    render(<MyComponent onAction={mockAction} />);

    const actionButton = findButtonByRole('Action');

    await clickAndWait(actionButton, {
      waitFor: () => assertSuccessToast(/action completed/i),
    });

    expect(mockAction).toHaveBeenCalled();
  });
});
```
