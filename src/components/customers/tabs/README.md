# Customer Detail Tabs

## Architecture Overview

This directory contains tab components for the Customer Detail page (`/customers/:customerId`).

### Navigation Flow

**Dual Entry Paths:**

1. **Finance**: Dashboard → AR Aging Report → Click Customer → `/customers/:id?tab=ar-aging`
2. **Operations**: Masters → Customers → Click Customer → `/customers/:id?tab=overview`

Both paths converge on the same Customer Detail page with 6 tabs.

---

## Tab Components

| Tab          | File                         | Purpose         | API Endpoint                           | Permissions Required             |
| ------------ | ---------------------------- | --------------- | -------------------------------------- | -------------------------------- |
| Overview     | `CustomerOverviewTab.jsx`    | 360° snapshot   | N/A (uses parent data)                 | `customers.read`                 |
| AR Aging     | `CustomerARAgingDetail.jsx`  | AR analysis     | `GET /api/reports/ar-aging/:id`        | `customers.read`, `finance.view` |
| Invoices     | `CustomerInvoicesTab.jsx`    | Invoice list    | `GET /api/invoices?customerId=:id`     | `invoices.read`                  |
| Payments     | `CustomerPaymentsTab.jsx`    | Payment history | `GET /api/payments?customerId=:id`     | `payments.read`                  |
| Credit Notes | `CustomerCreditNotesTab.jsx` | Credit notes    | `GET /api/credit-notes?customerId=:id` | `credit_notes.read`              |
| Activity     | `CustomerActivityTab.jsx`    | Timeline        | `GET /api/activities?customerId=:id`   | `customers.read`                 |

---

## Tab Details

### 1. Overview Tab

**File:** `CustomerOverviewTab.jsx`

**Purpose:** Provides comprehensive 360° customer snapshot without requiring additional API calls.

**Features:**

- Master data (name, code, contact info)
- Credit summary (limit, used, available, utilization %)
- AR summary (outstanding, overdue, aging buckets)
- Visual indicators (progress bars, status badges)

**Data Source:** Receives customer object from parent component (no caching needed)

---

### 2. AR Aging Detail Tab

**File:** `CustomerARAgingDetail.jsx` (in parent directory)

**Purpose:** Deep dive into customer's AR aging with bucket-level analysis.

**Features:**

- Detailed aging buckets (0-30, 31-60, 61-90, 90+ days)
- Invoice-level breakdown within each bucket
- Credit limit vs outstanding analysis
- Overdue percentage calculation

**API:** `GET /api/reports/ar-aging/:id`

**Permissions:** `customers.read` AND `finance.view`

---

### 3. Invoices Tab

**File:** `CustomerInvoicesTab.jsx`

**Purpose:** Customer-scoped invoice list with comprehensive filtering.

**Features:**

- Summary cards (count, total, outstanding, overdue)
- Status filter (all/open/paid/partially-paid/overdue)
- Date range filter (all/30/60/90 days)
- Sortable columns (date, amount, due date)
- Pagination (20 per page)
- Color-coded status badges

**API:** `GET /api/invoices?customerId={customerId}`

**Caching:** 5 minutes

---

### 4. Payments Tab

**File:** `CustomerPaymentsTab.jsx`

**Purpose:** Payment history with allocation breakdown.

**Features:**

- Summary cards (total received, allocated, unallocated, last payment)
- Date range filter (all/30/60/90 days)
- Payment method filter (cash/check/bank/card)
- Expandable rows showing allocation to invoices
- Payment method icons
- Pagination (20 per page)

**API:** `GET /api/payments?customerId={customerId}`

**Caching:** 5 minutes

---

### 5. Credit Notes Tab

**File:** `CustomerCreditNotesTab.jsx`

**Purpose:** Credit notes with application status tracking.

**Features:**

- Summary cards (count, total issued, applied, remaining)
- Status filter (open/partially-applied/fully-applied)
- Date range filter (all/30/60/90 days)
- Linked invoice references
- Status badges (color-coded)
- Pagination (20 per page)

**API:** `GET /api/credit-notes?customerId={customerId}`

**Caching:** 5 minutes

---

### 6. Activity Tab

**File:** `CustomerActivityTab.jsx`

**Purpose:** Chronological timeline of customer interactions.

**Features:**

- Timeline view (reverse chronological)
- Activity types (Note, Call, Email, Follow-up, Promise to Pay, Dispute)
- Type filter and content search
- Add new activity form
- Type-specific icons and colors

**API:** `GET /api/activities?customerId={customerId}&entityType=customer` (TODO: Not yet implemented)

**Status:** Currently using mock data for UI development

**Caching:** 5 minutes (when backend ready)

---

## Adding a New Tab

Follow these steps to add a new tab to the Customer Detail page:

### Step 1: Create Tab Component

Create a new file in this directory: `Customer[Name]Tab.jsx`

```javascript
/**
 * Customer [Name] Tab
 *
 * [Description of purpose]
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.customerId - Customer ID
 * @returns {JSX.Element} Tab content
 */
import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { apiClient } from '../../../services/api';

export default function Customer[Name]Tab({ customerId }) {
  const { isDarkMode } = useTheme();

  // Caching state
  const [cachedData, setCachedData] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check if cache is valid
  const isCacheValid = () => {
    if (!cachedData || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/your-endpoint?customerId=${customerId}`);
      const data = response.data || [];

      setData(data);
      setCachedData(data);
      setCacheTimestamp(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setCachedData(null);
    setCacheTimestamp(null);
    fetchData();
  };

  useEffect(() => {
    if (customerId) {
      if (isCacheValid()) {
        setData(cachedData);
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [customerId]);

  // Implement dark mode styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3>Your Tab Title</h3>
        <button onClick={handleRefresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Your content here */}
    </div>
  );
}
```

### Step 2: Add to CustomerDetail.jsx

1. **Import with lazy loading:**

```javascript
const Customer[Name]Tab = lazy(() =>
  import('../components/customers/tabs/Customer[Name]Tab'),
);
```

2. **Add to allTabs array:**

```javascript
const allTabs = [
  // ... existing tabs
  { id: "your-tab-id", label: "Your Tab Label" },
];
```

3. **Add to useCustomerTabPermissions hook:**

```javascript
const tabPermissions = {
  // ... existing permissions
  "your-tab-id": hasPermission("your.permission"),
};
```

4. **Add to render section:**

```javascript
{activeTab === 'your-tab-id' && (
  <Suspense fallback={<LoadingSpinner />}>
    <Customer[Name]Tab customerId={parseInt(customerId)} />
  </Suspense>
)}
```

---

## Performance Considerations

### Code Splitting

All tabs are lazy-loaded using `React.lazy()` to reduce initial bundle size. Only the active tab's code is loaded.

### Data Caching

Each tab implements 5-minute caching:

- Reduces redundant API calls
- Improves perceived performance
- Cache is cleared on manual refresh
- Cache is per-customerId (switching customers clears cache)

### Loading States

Every tab implements proper loading states:

- Skeleton UI or spinner during fetch
- Smooth transitions between states
- Error states with retry capability

### Optimization Tips

1. Use pagination for large datasets (default: 20 items per page)
2. Implement debounced search inputs
3. Avoid unnecessary re-renders with React.memo if needed
4. Use useMemo for expensive calculations
5. Lazy load heavy dependencies

---

## Permissions

Tab visibility is controlled by `useCustomerTabPermissions` hook located at:
`/src/hooks/useCustomerTabPermissions.js`

### Permission Logic

```javascript
const tabPermissions = {
  overview: hasPermission("customers.read"),
  "ar-aging": hasPermission("customers.read") && hasPermission("finance.view"),
  invoices: hasPermission("invoices.read"),
  payments: hasPermission("payments.read"),
  "credit-notes": hasPermission("credit_notes.read"),
  activity: hasPermission("customers.read"),
};
```

### Behavior

- Tabs without permission are hidden from navigation
- Direct URL access to forbidden tab redirects to first allowed tab
- If user has no tab permissions, shows "Access Denied" screen

### Mock Authentication

Currently using mock permissions for development. Replace with actual auth integration:

```javascript
// TODO: Replace mock auth with real implementation
const { user } = useAuth(); // Import from AuthContext when ready
```

---

## Common Patterns

### Dark Mode

```javascript
const { isDarkMode } = useTheme();
const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
const primaryText = isDarkMode ? "text-gray-100" : "text-gray-900";
```

### Currency Formatting

```javascript
import { formatCurrency } from "../../../utils/invoiceUtils";
formatCurrency(1234.56); // "$1,234.56"
```

### Date Formatting

```javascript
import { formatDate } from "../../../utils/invoiceUtils";
formatDate(new Date()); // "Jan 15, 2025"

// Or use date-fns directly
import { format } from "date-fns";
format(new Date(), "MMM dd, yyyy"); // "Jan 15, 2025"
```

### API Error Handling

```javascript
try {
  const response = await apiClient.get("/endpoint");
  setData(response.data);
} catch (err) {
  console.error("Failed to fetch data:", err);
  setError(err.message || "Failed to load data");
}
```

---

## Future Enhancements

### Planned Features

- [ ] Export functionality (Excel/PDF) per tab
- [ ] Real-time updates via WebSockets
- [ ] Bulk actions on invoices/payments
- [ ] Inline editing capabilities
- [ ] File attachments to activities
- [ ] Email integration for communication
- [ ] Advanced analytics and charts

### Backend Integration Needed

- [ ] Activity Tab API endpoints
- [ ] Bulk action endpoints
- [ ] Real-time notification system
- [ ] Document upload/download APIs

---

## Testing Checklist

When modifying tabs, verify:

- [ ] Dark mode works correctly
- [ ] Loading states display properly
- [ ] Error states show retry button
- [ ] Empty states have helpful messaging
- [ ] Filters work as expected
- [ ] Pagination functions correctly
- [ ] Sorting updates URL or state
- [ ] Cache invalidates on refresh
- [ ] Permissions hide/show tabs correctly
- [ ] Mobile responsive (if applicable)
- [ ] No console errors
- [ ] ESLint warnings resolved

---

## Troubleshooting

### Tab Not Showing

1. Check permission configuration in `useCustomerTabPermissions.js`
2. Verify tab is in `allTabs` array in `CustomerDetail.jsx`
3. Check lazy import statement is correct
4. Ensure Suspense wrapper is present

### Data Not Loading

1. Verify API endpoint is correct
2. Check network tab for failed requests
3. Ensure customerId is being passed correctly
4. Check cache logic isn't preventing fetch

### Refresh Not Working

1. Verify `handleRefresh` clears cache state
2. Check `fetchData` is called after clearing cache
3. Ensure loading state updates correctly

---

## Support

For questions or issues:

- Check existing tab components for patterns
- Review CustomerDetail.jsx for routing logic
- Consult useCustomerTabPermissions.js for permission rules
- Review API client setup in `/src/services/api.js`
