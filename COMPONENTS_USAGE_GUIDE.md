# Ultimate Steel ERP - Components Usage Guide

**Comprehensive guide for using reusable components across all phases (Phases 1-6)**

---

## Core Components - Shared Library

All components located in `src/components/shared/`

### 1. **EmptyState** - Bug Fix #1, #24, #28, #30
**Purpose:** Consistent empty state display across all modules
**Files:** `src/components/shared/EmptyState.jsx`

```jsx
import EmptyState from '../components/shared/EmptyState';

// Basic usage
<EmptyState
  title="No Data Available"
  description="There is no data to display at the moment."
/>

// With action button
<EmptyState
  title="No Roles"
  description="Create your first role to get started."
  action={{
    label: 'Create Role',
    onClick: () => handleCreateRole(),
    variant: 'primary'
  }}
/>

// With custom icon
import { Users } from 'lucide-react';
<EmptyState
  icon={Users}
  title="No Users"
  description="Invite team members to get started."
  variant="info"
/>
```

**Variants:** `default`, `minimal`, `info`
**Props:**
- `icon` - Lucide React icon component
- `title` - Empty state heading
- `description` - Explanatory text
- `action` - Single or array of action buttons
- `variant` - Visual style variant

---

### 2. **LoadingSpinner** - Bug Fix #26, #27
**Purpose:** Flexible loading indicator for async operations
**File:** `src/components/shared/LoadingSpinner.jsx`

```jsx
import LoadingSpinner from '../components/shared/LoadingSpinner';

// Inline spinner with text
<LoadingSpinner inline={true} text="Loading..." size="sm" />

// Block spinner (centered)
<LoadingSpinner text="Generating report..." size="md" />

// Full screen overlay
<LoadingSpinner fullScreen={true} text="Processing..." />
```

**Props:**
- `size` - `sm`, `md` (default), `lg`, `xl`
- `inline` - Show inline (true) or block (false)
- `text` - Loading text label
- `fullScreen` - Full screen overlay mode

---

### 3. **RequiredIndicator** - Bug Fix #12
**Purpose:** Visual indicator for required form fields
**File:** `src/components/shared/RequiredIndicator.jsx`

```jsx
import RequiredIndicator from '../components/shared/RequiredIndicator';

<label>
  Invoice Date
  <RequiredIndicator />
</label>
```

---

### 4. **TruncatedText** - Bug Fix #11
**Purpose:** Truncate long text with hover tooltip
**File:** `src/components/shared/TruncatedText.jsx`

```jsx
import TruncatedText from '../components/shared/TruncatedText';

<TruncatedText
  text="Analytics Test Customer - Very Long Name"
  maxWidth="w-40"
  tooltipPosition="top"
/>
```

---

### 5. **IconButton** - Bug Fix #21
**Purpose:** Accessible icon buttons with automatic tooltips
**File:** `src/components/shared/IconButton.jsx`

```jsx
import IconButton from '../components/shared/IconButton';
import { Pencil, Trash2 } from 'lucide-react';

<IconButton
  icon={<Pencil size={18} />}
  title="Edit item"
  onClick={handleEdit}
/>
```

---

### 6. **StatusBadge** - Bug Fix #22
**Purpose:** Consistent status indicators with color coding
**File:** `src/components/shared/StatusBadge.jsx`

```jsx
import StatusBadge from '../components/shared/StatusBadge';

<StatusBadge variant="success" label="Balanced" />
<StatusBadge variant="danger" label="Unbalanced" />
<StatusBadge variant="warning" label="Pending" />
<StatusBadge variant="info" label="Processing" />
```

**Variants:** `draft`, `active`, `inactive`, `pending`, `success`, `danger`, `warning`, `info`

---

### 7. **FormFieldWrapper** - Bug Fix #13, #16
**Purpose:** Consistent form field styling and layout
**File:** `src/components/shared/FormFieldWrapper.jsx`

```jsx
import FormFieldWrapper from '../components/shared/FormFieldWrapper';

<FormFieldWrapper
  label="Customer Name"
  required={true}
  error={errors.customerName}
  helpText="The customer's full legal name"
>
  <input
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
  />
</FormFieldWrapper>
```

---

### 8. **TextInput** - Bug Fix #13, #14
**Purpose:** Accessible text input with label and error handling
**File:** `src/components/shared/TextInput.jsx`

```jsx
import TextInput from '../components/shared/TextInput';

<TextInput
  label="Company Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
  placeholder="e.g., Acme Corp"
  helpText="Your company's registered legal name"
/>
```

---

### 9. **Select** - Bug Fix #16
**Purpose:** Accessible select dropdown with consistent styling
**File:** `src/components/shared/Select.jsx`

```jsx
import Select from '../components/shared/Select';

<Select
  label="VAT Treatment"
  value={vatTreatment}
  onChange={(e) => setVatTreatment(e.target.value)}
  required
  error={errors.vatTreatment}
  placeholder="Select VAT treatment..."
  helpText="Choose the applicable VAT rate for this item"
  options={[
    { value: '', label: 'Select VAT treatment...' },
    { value: 'standard', label: 'Standard (5%)' },
    { value: 'zero', label: 'Zero-rated' },
    { value: 'exempt', label: 'Exempt' },
  ]}
/>
```

---

### 10. **DateInput** - Bug Fix #13
**Purpose:** Accessible date input with validation
**File:** `src/components/shared/DateInput.jsx`

```jsx
import DateInput from '../components/shared/DateInput';

<DateInput
  label="Invoice Date"
  value={invoiceDate}
  onChange={(e) => setInvoiceDate(e.target.value)}
  error={errors.invoiceDate}
  required
  helpText="Format: DD/MM/YYYY"
/>
```

---

### 11. **CurrencyInput** - Bug Fix #25
**Purpose:** Currency input with proper AED formatting
**File:** `src/components/shared/CurrencyInput.jsx`

```jsx
import CurrencyInput from '../components/shared/CurrencyInput';

<CurrencyInput
  label="Amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  error={errors.amount}
  required
  currency="AED"
  placeholder="0.00"
/>
```

---

### 12. **Skeleton** - Bug Fix #26
**Purpose:** Loading placeholder skeletons
**File:** `src/components/shared/Skeleton.jsx`

```jsx
import { TableSkeleton, CardSkeleton, ListSkeleton, FormSkeleton } from '../components/shared/Skeleton';

// Table loading
{loading && <TableSkeleton rows={5} columns={4} />}

// Card loading
{loading && <CardSkeleton count={3} />}

// List loading
{loading && <ListSkeleton items={8} />}

// Form loading
{loading && <FormSkeleton fields={5} />}
```

---

### 13. **Breadcrumb** - Bug Fix #10
**Purpose:** Navigation breadcrumb trail
**File:** `src/components/shared/Breadcrumb.jsx`

```jsx
import Breadcrumb from '../components/shared/Breadcrumb';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Invoices', href: '/invoices' },
    { label: 'INV-001', current: true }
  ]}
/>
```

---

### 14. **Modal** - Bug Fix #20
**Purpose:** Accessible modal dialog
**File:** `src/components/shared/Modal.jsx`

```jsx
import Modal from '../components/shared/Modal';

<Modal
  isOpen={showDialog}
  onClose={handleClose}
  title="Confirm Delete"
  size="sm"
>
  <p>Are you sure you want to delete this item?</p>
  <div className="mt-6 flex gap-3 justify-end">
    <button onClick={handleClose}>Cancel</button>
    <button onClick={handleDelete}>Delete</button>
  </div>
</Modal>
```

---

### 15. **ResponsiveTable** - Bug Fix #29, #30
**Purpose:** Table with responsive layout and sort indicators
**File:** `src/components/shared/ResponsiveTable.jsx`

```jsx
import ResponsiveTable from '../components/shared/ResponsiveTable';

<ResponsiveTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  ]}
  data={data}
  onSort={(column, direction) => handleSort(column, direction)}
  loading={loading}
/>
```

---

### 16. **Container** - Bug Fix #20
**Purpose:** Responsive container with consistent padding
**File:** `src/components/shared/Container.jsx`

```jsx
import Container from '../components/shared/Container';

<Container size="lg">
  {/* Content */}
</Container>
```

**Sizes:** `sm`, `md` (default), `lg`, `xl`

---

## Usage Patterns by Phase

### Phase 1: Data Issues
- Use EmptyState for invoice preview sections with no data
- Sanitize company names in data display

### Phase 2: Form Consistency
- Wrap all form fields with FormFieldWrapper
- Add helpText to clarify expectations
- Use Select with proper placeholder text
- Add RequiredIndicator to required fields

### Phase 3: Navigation
- Add Breadcrumb to all detail/edit pages
- Use .link class for styled links
- Apply consistent tab styling with overflow handling

### Phase 4: Loading & Feedback
- Replace inline spinners with LoadingSpinner
- Add LoadingSpinner to report generation
- Use Skeleton components for data loading states
- Add help text to charts explaining data

### Phase 5: Visual Consistency
- Replace hardcoded empty states with EmptyState component
- Use StatusBadge for all status indicators
- Use IconButton for all icon-only buttons
- Standardize button weights (primary vs secondary)
- Add TruncatedText for long content

### Phase 6: Accessibility
- Add sort direction indicators (↑/↓) to ResponsiveTable
- Ensure all interactive elements have title/aria-label
- Use proper color contrast per WCAG
- Deduplicate VAT rates in master data

---

## CSS Utilities - Bug Fix #9

### Link Styling
```css
/* Automatically applied to all <a> tags */
a {
  @apply text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors;
}

/* Or use .link class explicitly */
<a href="/path" className="link">Link Text</a>
```

---

## Currency Formatting - Bug Fix #25

```jsx
import { formatCurrency } from '../utils/invoiceUtils';

// Automatically formats to AED with proper symbol
const formatted = formatCurrency(1000.50);  // "د.إ1,000.50"
```

---

## Text Casing Standards - Bug Fix #23

- **Page Titles:** Title Case (Every Word Capitalized)
- **Button Labels:** Title Case
- **Field Labels:** Title Case
- **Placeholder Text:** lowercase sentence case
- **Help Text:** lowercase sentence case
- **Error Messages:** Sentence case (First word capitalized)
- **Status Values:** UPPERCASE or Title Case (consistent)

---

## Accessibility Requirements

All components include:
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Color contrast (WCAG AA)
- ✅ Semantic HTML
- ✅ Error messaging

---

## Implementation Checklist

When implementing components across pages:

- [ ] Import component from `src/components/shared/`
- [ ] Add required props (label, value, onChange for inputs)
- [ ] Add error handling with error prop
- [ ] Add required indicator if field is required
- [ ] Add helpText for clarity
- [ ] Test dark mode styling
- [ ] Test mobile responsiveness
- [ ] Run `npm run lint:fix` after changes
- [ ] Run `npx prettier --write src/` to format
- [ ] Verify no console errors
- [ ] Commit with bug reference

---

**Last Updated:** 2026-01-29
**Related:** UX_UI_BUG_FIX_PLAN_PHASE2.md, UX_UI_BUG_FIX_PLAN.md
