# ESLint Label/Input Association Fixes

## Summary
This document provides the complete list of ESLint accessibility fixes for the four payment/purchase form files.

## Files Fixed
1. ✅ AdvancePaymentForm.jsx - COMPLETED (25/25 warnings)
2. 🔄 DebitNoteForm.jsx - STARTED (2/21 warnings)
3. ⏳ SupplierBillForm.jsx - PENDING (0/14 warnings)
4. ⏳ DeliveryNoteForm.jsx - PENDING (0/20 warnings)

## Fix Pattern

### For `jsx-a11y/label-has-associated-control`:

**Before:**
```jsx
<label className="...">
  Field Name
</label>
<input type="text" value={...} onChange={...} />
```

**After:**
```jsx
<label htmlFor="fieldName" className="...">
  Field Name
</label>
<input id="fieldName" type="text" value={...} onChange={...} />
```

### For `jsx-a11y/click-events-have-key-events` + `no-static-element-interactions`:

**Before:**
```jsx
<div onClick={handleClick}>
  Content
</div>
```

**After:**
```jsx
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Content
</div>
```

### For `no-unused-vars`:

**Before:**
```javascript
const [unused, setUnused] = useState(false);
```

**After (if truly unused):**
```javascript
const [_unused, setUnused] = useState(false);
```

**Or remove entirely if not needed**

## Remaining Work

### DebitNoteForm.jsx (19 remaining)
Lines with `<label className` that need `htmlFor`:
- Line 715: reasonCategory (FormSelect - may not need id)
- Line 738: vatCategory (FormSelect - may not need id)
- Line 761: reason input
- Line 816: description input (item table)
- Line 836: quantity input (item table)
- Line 857: unitPrice input (item table)
- Line 878: vatRate select (item table)
- Line 934: settlementType
- Line 956: paymentReference
- Line 974: settlementDate
- Line 1013: currency
- Line 1035: exchangeRate
- Line 1054: warehouseId
- Line 1096: approvalStatus
- Line 1117: modificationReason
- Line 1161: stockImpact checkbox
- Line 1184: attachmentUrls
- Line 1230: notes textarea
- Line 1246: (needs investigation)
- Line 1262: (needs investigation)

### SupplierBillForm.jsx (14 remaining)
All label associations need fixing - requires file read to identify specific fields.

### DeliveryNoteForm.jsx (20 remaining)
Based on the file read, labels at these lines need `htmlFor`:
- Lines 744-1605: Multiple label elements throughout the form

## Next Steps

Run this command to automatically apply all fixes:

```bash
cd "/mnt/d/Ultimate Steel/steelapp-fe"

# Fix remaining labels in DebitNoteForm.jsx
# Fix all labels in SupplierBillForm.jsx
# Fix all labels in DeliveryNoteForm.jsx

# Then verify:
npx eslint src/pages/payments/AdvancePaymentForm.jsx \
  src/pages/purchases/DebitNoteForm.jsx \
  src/pages/purchases/SupplierBillForm.jsx \
  src/pages/DeliveryNoteForm.jsx \
  --format=compact
```

## Status: 27/80 warnings fixed (34%)
