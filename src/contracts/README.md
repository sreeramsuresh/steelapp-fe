# API Contract Validation System (DEV-only)

## Overview

A comprehensive TypeScript-based contract validation system that validates API request and response payloads **in development mode only** using Zod schemas. This guard prevents invalid data from being sent to the backend and alerts developers to API contract mismatches.

## Features

✅ **DEV-only** - Zero impact on production bundle and performance
✅ **Single enforcement point** - All validation happens in `apiService.request()`
✅ **URL pattern matching** - Supports `:param` segments (e.g., `/invoices/:id`)
✅ **Type-safe schemas** - Powered by Zod for strong TypeScript integration
✅ **Smart skipping** - Automatically skips FormData, blob, and arraybuffer
✅ **Enhanced logging** - Clear, collapsed console groups for debugging
✅ **No axios interference** - Works seamlessly with existing interceptors

---

## Installation

### 1. Install Zod

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
npm install zod
```

### 2. Files Already Created

The contract system consists of these files:

```
steelapp-fe/src/contracts/
├── contractRegistry.ts      # Zod schemas for endpoints
├── matchContract.ts         # URL pattern matching
├── validateContract.ts      # Validation logic + ContractViolationError
└── README.md               # This file
```

### 3. Integration Point

The validation is integrated into `src/services/axiosApi.js` at lines 224-299 in the `apiService.request()` method.

---

## Usage

### Adding a New Contract

Edit `contractRegistry.ts` and add your endpoint:

```typescript
import { z } from 'zod';

// 1. Define request schema
const CreateCustomerRequestSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('invalid email format'),
  phone: z.string().optional(),
  creditLimit: z.number().nonnegative(),
});

// 2. Define response schema (optional)
const CreateCustomerResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

// 3. Register in contractRegistry
export const contractRegistry: Record<string, ContractDefinition> = {
  'POST /customers': {
    request: CreateCustomerRequestSchema,
    response: CreateCustomerResponseSchema,
  },

  // ... other contracts
};
```

### URL Pattern Matching

The system supports parameter segments using `:param` syntax:

```typescript
// Exact match
'GET /invoices' → matches: GET /invoices

// Parameter match
'GET /invoices/:id' → matches: GET /invoices/123, GET /invoices/456

// Multiple parameters
'GET /invoices/:id/items/:itemId' → matches: GET /invoices/123/items/456
```

### Strict vs. Permissive Validation

Use `.strict()` for schemas that should reject unknown keys:

```typescript
const StrictSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .strict(); // ❌ Rejects: { id: 1, name: "foo", extra: "bar" }

const PermissiveSchema = z.object({
  id: z.number(),
  name: z.string(),
}); // ✅ Allows: { id: 1, name: "foo", extra: "bar" }
```

**Recommendation**: Use `.strict()` for critical endpoints like invoice creation to catch typos and ensure data integrity.

---

## How It Works

### Request Flow

```
1. Service calls apiClient.post('/invoices', data)
   ↓
2. apiClient delegates to apiService.request({ method: 'POST', url: '/invoices', data })
   ↓
3. [DEV ONLY] validateRequestContract() runs:
   - Matches 'POST /invoices' in contractRegistry
   - Validates data against request schema
   - Throws ContractViolationError if invalid
   ↓
4. Axios request interceptor adds Authorization header
   ↓
5. api.request(config) executes
   ↓
6. Axios response interceptor handles 401/403 refresh
   ↓
7. [DEV ONLY] validateResponseContract() runs:
   - Validates response.data against response schema
   - Throws ContractViolationError if invalid
   ↓
8. Returns response.data (unwrapped)
```

### Error Example

When validation fails in DEV, you'll see:

```
[Contract Violation] REQUEST POST /invoices
  Validation Issues:
    1. items[0].allocation_mode: Required
    2. items[0].manual_allocations: Expected array, received undefined
  Request Data: { customerId: 123, items: [...] }
```

---

## Registered Contracts

Currently registered endpoints (see `contractRegistry.ts` for full details):

| Endpoint                               | Request   | Response |
| -------------------------------------- | --------- | -------- |
| `POST /invoices`                       | ✅ Strict | ✅ Basic |
| `PUT /invoices/:id`                    | ✅ Strict | ✅ Basic |
| `DELETE /batch-reservations/line-item` | ✅ Strict | ✅ Full  |
| `POST /batch-reservations/fifo`        | ✅ Strict | ✅ Full  |

**Goal**: Expand coverage to all critical endpoints over time.

---

## Validation Rules

### What Gets Validated

✅ **Request validation**:

- Methods: POST, PUT, PATCH, DELETE with JSON body
- Skips: GET (no body), FormData uploads, Blob/File

✅ **Response validation**:

- All JSON responses (default `responseType`)
- Skips: `responseType: 'blob'` (file downloads), `responseType: 'arraybuffer'`

### What Gets Skipped

❌ **Never validated**:

- `FormData` uploads (e.g., file uploads)
- `Blob` / `ArrayBuffer` responses (file downloads)
- Endpoints not in `contractRegistry` (allows through with optional warning)

---

## Best Practices

### 1. Start with Critical Endpoints

Prioritize contracts for:

- Invoice creation/updating (financial integrity)
- Payment allocation (batch reservations)
- Stock movements (inventory accuracy)
- VAT calculations (compliance)

### 2. Use `.strict()` for High-Risk Schemas

```typescript
const InvoiceItemSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
  allocation_mode: z.enum(['AUTO_FIFO', 'MANUAL']),
  manual_allocations: z.array(...),
}).strict(); // ← Prevents typos in critical fields
```

### 3. Validate Nested Objects

```typescript
const InvoiceRequestSchema = z.object({
  customerId: z.number(),
  items: z
    .array(
      z
        .object({
          productId: z.number(),
          allocations: z.array(
            z
              .object({
                batch_id: z.number(),
                quantity: z.number(),
              })
              .strict(), // ← Strict nested object
          ),
        })
        .strict(),
    )
    .min(1, 'items cannot be empty'),
});
```

### 4. Use Custom Refinements

```typescript
const InvoiceItemSchema = z
  .object({
    sourceType: z.enum(['WAREHOUSE', 'DROP_SHIP']),
    allocation_mode: z.string().optional(),
  })
  .refine(
    (item) => {
      if (item.sourceType === 'WAREHOUSE') {
        return item.allocation_mode !== undefined;
      }
      return true;
    },
    {
      message: 'WAREHOUSE items must have allocation_mode',
      path: ['allocation_mode'],
    },
  );
```

### 5. Union Types for Flexible Fields

```typescript
const quantitySchema = z.union([z.number(), z.string()]).refine(
  (val) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && num > 0;
  },
  { message: 'quantity must be positive' },
);
```

---

## Debugging

### Enable Contract Warnings

To see which endpoints lack contracts, check the console in DEV mode:

```
[Contract Guard] No contract registered for: GET /products
  └─ Consider adding to contractRegistry.ts for validation.
```

This warning appears **once per endpoint** per session.

### Inspecting Contract Violations

When validation fails, use the collapsed console group:

```javascript
[Contract Violation] REQUEST POST /invoices
  ▼ Validation Issues:
      1. items[0].quantity: Expected number, received string
      2. items[0].allocation_mode: Invalid enum value
  ▼ Request Data: { ... }
```

### Testing Contracts

Create a simple test in your service:

```typescript
// In invoiceService.test.ts
import { matchContract } from '../contracts/matchContract';

test('invoice contract exists', () => {
  const contract = matchContract({
    method: 'POST',
    url: '/invoices',
  });

  expect(contract).toBeDefined();
  expect(contract?.request).toBeDefined();
});
```

---

## Production Behavior

**In production** (`import.meta.env.PROD`):

- ✅ All validation code is **tree-shaken** (removed from bundle)
- ✅ Zero runtime overhead
- ✅ No console warnings
- ✅ `apiService.request()` executes original behavior only

The `IS_DEV` constant ensures validation code is compiled out in production builds.

---

## Extending the System

### Adding Response-Only Validation

Some endpoints may only need response validation:

```typescript
'GET /analytics/dashboard': {
  // No request schema (GET has no body)
  response: z.object({
    revenue: z.number(),
    profit: z.number(),
    orders: z.number(),
  }),
}
```

### Adding Custom Validators

You can create reusable validators in `contractRegistry.ts`:

```typescript
const PositiveNumberOrString = z.union([z.number(), z.string()]).refine(
  (val) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && num > 0;
  },
  { message: 'must be positive number or numeric string' },
);

// Use across multiple schemas
const ItemSchema = z.object({
  quantity: PositiveNumberOrString,
  unitPrice: PositiveNumberOrString,
});
```

### Pattern Extraction

Use `extractParams()` from `matchContract.ts` to get URL parameters:

```typescript
import { extractParams } from './matchContract';

const params = extractParams('/invoices/123', '/invoices/:id');
// Returns: { id: '123' }
```

---

## Troubleshooting

### "Zod is not installed"

```bash
npm install zod
```

### "Contract violation but data looks correct"

Check for:

1. **Type mismatches**: `"123"` (string) vs `123` (number)
2. **Unknown keys**: Using `.strict()` but sending extra fields
3. **Null vs undefined**: Zod differentiates between these

### "Too many warnings in console"

The system warns once per endpoint. If you see many warnings, it means you're hitting many unregistered endpoints. Either:

1. Add contracts for those endpoints
2. Comment out the warning in `validateContract.ts` (line 172-178)

### "FormData upload fails validation"

This shouldn't happen - FormData is automatically skipped. If it does:

1. Check that `config.data instanceof FormData` is true
2. Verify `shouldValidateData()` logic in `validateContract.ts`

---

## Migration Guide

To gradually adopt this system:

### Phase 1: Critical Endpoints (Week 1)

- ✅ Invoice creation/update
- ✅ Batch reservations
- ✅ Payment allocation

### Phase 2: Common CRUD (Week 2)

- Customer CRUD
- Product CRUD
- Supplier CRUD

### Phase 3: Domain-Specific (Week 3)

- Import containers
- Stock movements
- VAT adjustments

### Phase 4: Complete Coverage (Ongoing)

- All remaining endpoints
- Add response validation where missing

---

## FAQ

### Q: Does this slow down development?

**A**: Initial setup takes time, but it pays off by:

- Catching bugs before they reach the backend
- Providing instant feedback on data shape
- Serving as living documentation
- Reducing debugging time

### Q: Can I disable validation for specific requests?

**A**: Not directly, but you can:

1. Skip by not registering the contract
2. Wrap the call in try-catch and ignore ContractViolationError
3. Set `import.meta.env.DEV = false` temporarily (not recommended)

### Q: How do I validate query parameters?

**A**: Query params are in `config.params`. Extend `validateRequestContract()` to validate them if needed.

### Q: Can I use this with TypeScript?

**A**: Yes! Zod schemas are fully TypeScript-compatible. You can even infer types:

```typescript
import { z } from 'zod';

const CustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type Customer = z.infer<typeof CustomerSchema>;
// → { id: number; name: string }
```

---

## Contributing

When adding new endpoints to the application:

1. **Define the contract** in `contractRegistry.ts`
2. **Test locally** by triggering the endpoint in DEV mode
3. **Verify validation** by intentionally sending invalid data
4. **Update this README** if adding new patterns or utilities

---

## Support

For issues or questions:

- Check console for `[Contract Violation]` messages
- Review Zod documentation: https://zod.dev
- Inspect `axiosApi.js` lines 224-299 for integration details
- Ask the team in #engineering-frontend

---

**Last Updated**: 2025-12-16
**Maintained By**: Frontend Engineering Team
