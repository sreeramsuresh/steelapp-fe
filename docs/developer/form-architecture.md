# Form Architecture Documentation

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Frontend Developers

---

## Overview

This document describes the architecture, component structure, state management patterns, and validation patterns used across all forms in the Ultimate Steel ERP frontend.

---

## Core Architecture Principles

### 1. Component Hierarchy

```
<FormContainer>
  └── <FormProvider> (React Hook Form context)
      ├── <FormHeader> (title, status, breadcrumbs)
      ├── <FormTabs> (multi-section forms)
      │   ├── <TabPanel id="basic">
      │   │   ├── <FormField> (controlled inputs)
      │   │   ├── <FormSelect> (dropdowns)
      │   │   └── <FormCheckbox> (boolean fields)
      │   ├── <TabPanel id="customs">
      │   │   └── ... (section-specific fields)
      │   └── <TabPanel id="items">
      │       └── <ItemsTable> (line items grid)
      ├── <ValidationSummary> (error display)
      └── <FormActions> (Submit, Cancel, Save Draft)
```

### 2. State Management Strategy

**Primary Tool:** React Hook Form (`useForm`)

**Why React Hook Form?**

- Minimal re-renders (uncontrolled components)
- Built-in validation
- Easy integration with Zod schema
- Form state persistence

**State Layers:**

| Layer            | Tool                         | Purpose                                |
| ---------------- | ---------------------------- | -------------------------------------- |
| **Form State**   | React Hook Form              | Input values, validation, dirty state  |
| **Server State** | React Query / TanStack Query | API fetching, caching, mutations       |
| **UI State**     | useState / useReducer        | Modal visibility, loading states, tabs |
| **Global State** | Context API                  | User session, company_id, permissions  |

**Example: ExportOrderForm State Structure**

```javascript
const {
  register, // Register input fields
  handleSubmit, // Form submission handler
  watch, // Watch field values for reactivity
  setValue, // Programmatically set values
  formState: {
    errors, // Validation errors
    isDirty, // Has form been modified?
    isSubmitting, // Submission in progress?
  },
} = useForm({
  defaultValues: {
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    shipmentType: "WAREHOUSE",
    vatRate: 0.05,
    items: [],
  },
  resolver: zodResolver(exportOrderSchema), // Zod validation
});
```

### 3. Validation Architecture

**Validation Layers:**

1. **Field-level validation** (real-time as user types)
2. **Cross-field validation** (when dependent fields change)
3. **Form-level validation** (on submit)
4. **Server-side validation** (API response errors)

**Implementation: Zod Schema**

```javascript
// schemas/exportOrder.schema.js
import { z } from "zod";

export const exportOrderSchema = z
  .object({
    customerId: z.string().min(1, "Customer is required"),
    orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    shipmentType: z.enum(["WAREHOUSE", "DROP_SHIP"]),
    vatRate: z.number().min(0).max(1),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Product is required"),
          quantity: z.number().positive("Quantity must be positive"),
          batchId: z.string().optional(),
        }),
      )
      .min(1, "At least one item is required"),
  })
  .refine(
    (data) => {
      // Cross-field validation: DROP_SHIP must have supplier per item
      if (data.shipmentType === "DROP_SHIP") {
        return data.items.every((item) => item.supplierId);
      }
      return true;
    },
    {
      message: "DROP_SHIP orders require supplier selection per item",
      path: ["shipmentType"],
    },
  );
```

**Field-Level Validation Example:**

```jsx
<FormField
  label="BOE Number"
  {...register("boeNumber", {
    required: "BOE number is required",
    pattern: {
      value: /^BOE-\d{4}-\d{6}$/,
      message: "Format: BOE-YYYY-NNNNNN",
    },
  })}
  error={errors.boeNumber?.message}
/>
```

**Cross-Field Validation Example:**

```javascript
// Watch shipmentType to conditionally validate supplier
const shipmentType = watch("shipmentType");

useEffect(() => {
  if (shipmentType === "DROP_SHIP") {
    // Trigger validation for supplier fields
    trigger("items.*.supplierId");
  }
}, [shipmentType]);
```

---

## Component Patterns

### 1. Reusable Form Components

**Location:** `/src/components/forms/`

**Core Components:**

#### FormField (Text Input)

```jsx
// components/forms/FormField.jsx
export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  error,
  required = false,
  disabled = false,
  ...registerProps
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "error" : ""}
        {...registerProps}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
```

#### FormSelect (Dropdown)

```jsx
// components/forms/FormSelect.jsx
export function FormSelect({
  label,
  name,
  options,
  placeholder = "Select...",
  error,
  required = false,
  ...registerProps
}) {
  return (
    <div className="form-select">
      <label htmlFor={name}>
        {label} {required && <span className="required">*</span>}
      </label>
      <select id={name} className={error ? "error" : ""} {...registerProps}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
```

#### FormCheckbox (Boolean Input)

```jsx
// components/forms/FormCheckbox.jsx
export function FormCheckbox({
  label,
  name,
  description,
  error,
  ...registerProps
}) {
  return (
    <div className="form-checkbox">
      <label>
        <input type="checkbox" {...registerProps} />
        <span>{label}</span>
      </label>
      {description && <p className="description">{description}</p>}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
```

### 2. Complex Components

#### BatchAllocator (FIFO Batch Selection)

**Location:** `/src/components/stock/BatchAllocator.jsx`

**Purpose:** Reusable component for FIFO batch allocation across ExportOrderForm, ReservationForm, TransferForm.

**Props:**

```typescript
interface BatchAllocatorProps {
  productId: string;
  quantityRequired: number;
  warehouseId?: string;
  onAllocationChange: (batches: AllocatedBatch[]) => void;
  autoAllocate?: boolean; // Default: true (FIFO)
}

interface AllocatedBatch {
  batchId: string;
  batchNumber: string;
  procurementDate: string;
  availableQty: number;
  allocatedQty: number;
  landedCost: number;
}
```

**Implementation:**

```jsx
// components/stock/BatchAllocator.jsx
import { useState, useEffect } from "react";
import { fetchAvailableBatches } from "@/api/batches";

export function BatchAllocator({
  productId,
  quantityRequired,
  warehouseId,
  onAllocationChange,
  autoAllocate = true,
}) {
  const [batches, setBatches] = useState([]);
  const [allocation, setAllocation] = useState([]);

  // Fetch available batches
  useEffect(() => {
    if (!productId) return;

    fetchAvailableBatches({ productId, warehouseId }).then((data) => {
      // Sort by procurement date (FIFO)
      const sorted = data.sort(
        (a, b) => new Date(a.procurementDate) - new Date(b.procurementDate),
      );
      setBatches(sorted);

      if (autoAllocate) {
        allocateFIFO(sorted, quantityRequired);
      }
    });
  }, [productId, warehouseId]);

  // FIFO allocation algorithm
  function allocateFIFO(availableBatches, qtyNeeded) {
    const allocated = [];
    let remaining = qtyNeeded;

    for (const batch of availableBatches) {
      if (remaining <= 0) break;

      const allocQty = Math.min(batch.availableQty, remaining);
      allocated.push({
        ...batch,
        allocatedQty: allocQty,
      });
      remaining -= allocQty;
    }

    setAllocation(allocated);
    onAllocationChange(allocated);
  }

  // Manual allocation adjustment
  function handleManualAllocation(batchId, qty) {
    const updated = allocation.map((b) =>
      b.batchId === batchId ? { ...b, allocatedQty: qty } : b,
    );
    setAllocation(updated);
    onAllocationChange(updated);
  }

  return (
    <div className="batch-allocator">
      <h4>Batch Allocation (FIFO)</h4>
      <table>
        <thead>
          <tr>
            <th>Batch No.</th>
            <th>Procurement Date</th>
            <th>Available</th>
            <th>Allocated</th>
            <th>Landed Cost</th>
          </tr>
        </thead>
        <tbody>
          {allocation.map((batch) => (
            <tr key={batch.batchId}>
              <td>{batch.batchNumber}</td>
              <td>{batch.procurementDate}</td>
              <td>{batch.availableQty} KG</td>
              <td>
                {autoAllocate ? (
                  <span>{batch.allocatedQty} KG</span>
                ) : (
                  <input
                    type="number"
                    value={batch.allocatedQty}
                    max={batch.availableQty}
                    onChange={(e) =>
                      handleManualAllocation(
                        batch.batchId,
                        Number(e.target.value),
                      )
                    }
                  />
                )}
              </td>
              <td>{batch.landedCost.toFixed(2)} AED/KG</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Total Allocated:{" "}
        {allocation.reduce((sum, b) => sum + b.allocatedQty, 0)} KG / Required:{" "}
        {quantityRequired} KG
      </p>
    </div>
  );
}
```

**Usage in ExportOrderForm:**

```jsx
import { BatchAllocator } from "@/components/stock/BatchAllocator";

function ExportOrderForm() {
  const [items, setItems] = useState([]);

  function handleBatchAllocation(itemIndex, allocatedBatches) {
    const updated = [...items];
    updated[itemIndex].batches = allocatedBatches;
    setItems(updated);
  }

  return (
    <form>
      {/* ... other fields ... */}
      {items.map((item, idx) => (
        <div key={idx}>
          <FormField label="Product" value={item.productName} disabled />
          <FormField label="Quantity" value={item.quantity} disabled />

          <BatchAllocator
            productId={item.productId}
            quantityRequired={item.quantity}
            onAllocationChange={(batches) =>
              handleBatchAllocation(idx, batches)
            }
            autoAllocate={true}
          />
        </div>
      ))}
    </form>
  );
}
```

---

## Data Flow Patterns

### 1. Form Submission Flow

```
User clicks Submit
  ↓
handleSubmit (React Hook Form)
  ↓
Validate form (Zod schema)
  ↓
[If invalid] Display errors → Stop
  ↓
[If valid] Transform data (camelCase → snake_case)
  ↓
API call (mutation)
  ↓
[If error] Display API errors → Stop
  ↓
[If success] Show success message → Redirect
```

**Implementation:**

```javascript
const onSubmit = async (data) => {
  try {
    // Transform data for API
    const payload = transformToSnakeCase(data);

    // API mutation
    const response = await createExportOrder(payload);

    // Success handling
    toast.success("Export order created successfully");
    navigate(`/export-orders/${response.id}`);
  } catch (error) {
    // Error handling
    if (error.response?.data?.errors) {
      // Map API errors to form fields
      Object.entries(error.response.data.errors).forEach(([field, message]) => {
        setError(field, { type: "server", message });
      });
    } else {
      toast.error("Failed to create export order");
    }
  }
};
```

### 2. Field Dependency Flow

**Example: VAT Rate Auto-Selection Based on Customer Type**

```javascript
// Watch customer selection
const customerId = watch("customerId");

// Fetch customer details and set VAT rate
useEffect(() => {
  if (!customerId) return;

  fetchCustomer(customerId).then((customer) => {
    // Auto-set VAT rate based on customer type
    const vatRate =
      customer.type === "UAE_MAINLAND"
        ? 0.05
        : customer.type === "DESIGNATED_ZONE"
          ? 0.0
          : customer.type === "FOREIGN"
            ? 0.0
            : 0.05;

    setValue("vatRate", vatRate);
    setValue("customerTRN", customer.trn);
  });
}, [customerId]);
```

### 3. Calculated Fields Pattern

**Example: Landed Cost Calculation**

```javascript
// Watch FOB, freight, duty to recalculate landed cost
const fobCost = watch("fobCost");
const freightCost = watch("freightCost");
const dutyCost = watch("dutyCost");

useEffect(() => {
  const landedCost = fobCost + freightCost + dutyCost;
  setValue("landedCost", landedCost, { shouldValidate: true });
}, [fobCost, freightCost, dutyCost]);
```

---

## API Integration Patterns

### 1. Data Fetching (React Query)

```javascript
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/api/products";

function ProductSelector() {
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FormSelect
      label="Product"
      name="productId"
      options={products.map((p) => ({
        value: p.id,
        label: p.uniqueName, // SSOT naming
      }))}
    />
  );
}
```

### 2. Form Mutations

```javascript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createImportOrder } from "@/api/importOrders";

function ImportOrderForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createImportOrder,
    onSuccess: (data) => {
      // Invalidate related queries to refetch
      queryClient.invalidateQueries(["importOrders"]);
      toast.success("Import order created");
      navigate(`/import-orders/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(transformToSnakeCase(data));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? "Saving..." : "Create Order"}
      </button>
    </form>
  );
}
```

---

## Naming Conventions

### File Naming

| Pattern              | Example                 | Purpose               |
| -------------------- | ----------------------- | --------------------- |
| `[Entity]Form.jsx`   | `ExportOrderForm.jsx`   | Main form component   |
| `[entity].schema.js` | `exportOrder.schema.js` | Zod validation schema |
| `[entity].api.js`    | `exportOrder.api.js`    | API client functions  |
| `use[Entity]Form.js` | `useExportOrderForm.js` | Custom form hook      |

### Variable Naming

**JavaScript/React (camelCase):**

```javascript
const customerId = "123";
const vatRate = 0.05;
const shipmentType = "WAREHOUSE";
```

**API Payloads (snake_case):**

```javascript
const payload = {
  customer_id: "123",
  vat_rate: 0.05,
  shipment_type: "WAREHOUSE",
};
```

**Transformation Function:**

```javascript
// utils/caseConversion.js
export function transformToSnakeCase(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    );
    acc[snakeKey] = value;
    return acc;
  }, {});
}
```

---

## Error Handling Patterns

### 1. Field-Level Errors (Validation)

```jsx
<FormField
  label="BOE Number"
  {...register("boeNumber")}
  error={errors.boeNumber?.message}
/>
```

### 2. Form-Level Errors (API)

```jsx
{
  errors.root?.server && (
    <Alert type="error">{errors.root.server.message}</Alert>
  );
}
```

### 3. Global Error Boundary

```jsx
// components/ErrorBoundary.jsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Form Error:", error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**

```jsx
<ErrorBoundary>
  <ExportOrderForm />
</ErrorBoundary>
```

---

## Performance Optimization

### 1. Form Re-Render Optimization

**Problem:** Every keystroke causes entire form to re-render.

**Solution:** React Hook Form's uncontrolled components + `watch` selectively.

```javascript
// ❌ BAD: Watch entire form (triggers re-render on every field change)
const formValues = watch();

// ✅ GOOD: Watch only specific fields
const customerId = watch("customerId");
const shipmentType = watch("shipmentType");
```

### 2. Lazy Loading Large Dropdowns

```javascript
import { useState, useEffect } from "react";
import { debounce } from "lodash";

function ProductAutocomplete({ onSelect }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);

  const searchProducts = debounce((searchQuery) => {
    if (searchQuery.length < 3) return;

    fetchProducts({ search: searchQuery, limit: 20 }).then(setOptions);
  }, 300);

  useEffect(() => {
    searchProducts(query);
  }, [query]);

  return (
    <Autocomplete
      options={options}
      onInputChange={(e) => setQuery(e.target.value)}
      onSelect={onSelect}
    />
  );
}
```

### 3. Memoization for Calculated Fields

```javascript
import { useMemo } from "react";

const totalCost = useMemo(() => {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}, [items]); // Only recalculate when items change
```

---

## Testing Patterns

### Unit Tests (Validation)

```javascript
import { exportOrderSchema } from "./exportOrder.schema";

describe("ExportOrderForm Validation", () => {
  it("requires customer selection", () => {
    const result = exportOrderSchema.safeParse({
      customerId: "",
      orderDate: "2024-03-20",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Customer is required");
  });

  it("validates DROP_SHIP requires supplier", () => {
    const result = exportOrderSchema.safeParse({
      customerId: "123",
      shipmentType: "DROP_SHIP",
      items: [
        { productId: "P1", quantity: 100 }, // Missing supplierId
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error.message).toContain("supplier");
  });
});
```

### Integration Tests (Form Submission)

```javascript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportOrderForm } from "./ExportOrderForm";

describe("ExportOrderForm", () => {
  it("submits form successfully", async () => {
    const mockOnSubmit = jest.fn();

    render(<ExportOrderForm onSubmit={mockOnSubmit} />);

    // Fill form
    fireEvent.change(screen.getByLabelText("Customer"), {
      target: { value: "customer-123" },
    });
    fireEvent.change(screen.getByLabelText("Order Date"), {
      target: { value: "2024-03-20" },
    });

    // Submit
    fireEvent.click(screen.getByText("Create Order"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "customer-123",
          orderDate: "2024-03-20",
        }),
      );
    });
  });
});
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Transform Case

**Problem:** API expects `customer_id`, form sends `customerId` → 400 error.

**Solution:** Always use transformation function before API call.

```javascript
const onSubmit = (data) => {
  const payload = transformToSnakeCase(data);
  createOrder(payload);
};
```

### Pitfall 2: Not Clearing Errors on Field Change

**Problem:** Field shows error even after user corrects it.

**Solution:** React Hook Form auto-clears on change (if validation passes).

### Pitfall 3: Infinite Re-Render Loop

**Problem:** `useEffect` with missing dependencies triggers infinite loop.

```javascript
// ❌ BAD
useEffect(() => {
  setValue("total", calculateTotal(items)); // items not in deps
});

// ✅ GOOD
useEffect(() => {
  setValue("total", calculateTotal(items));
}, [items, setValue]); // Include all dependencies
```

---

## Summary

**Form Architecture Checklist:**

- ✅ Use React Hook Form for state management
- ✅ Define Zod schema for validation
- ✅ Reuse FormField, FormSelect, FormCheckbox components
- ✅ Extract complex logic to custom components (BatchAllocator)
- ✅ Use React Query for API integration
- ✅ Transform camelCase ↔ snake_case at API boundary
- ✅ Implement error handling at field, form, and global levels
- ✅ Optimize performance with selective watch and memoization
- ✅ Write unit and integration tests

---

**End of Form Architecture Documentation**
