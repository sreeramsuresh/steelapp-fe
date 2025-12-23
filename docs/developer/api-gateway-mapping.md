# API Gateway Mapping Guide

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Backend Developers, API Gateway Developers

---

## Overview

The API Gateway serves as the translation layer between the frontend (React/camelCase) and backend (gRPC/snake_case). This document details all field transformations, new endpoints, and mapping patterns implemented in Phase 3.

---

## Core Transformation Rules

### 1. Case Conversion

**Frontend → API Gateway → gRPC:**

```
customerId (camelCase) → customer_id (snake_case) → customer_id (proto)
```

**gRPC → API Gateway → Frontend:**

```
customer_id (proto) → customer_id (snake_case) → customerId (camelCase)
```

### 2. Timestamp Normalization

**Frontend (ISO 8601 string) → gRPC (Timestamp):**

```javascript
// Frontend
const orderDate = "2024-03-20T10:30:00.000Z";

// API Gateway transforms to:
{
  seconds: 1710930600,
  nanos: 0
}
```

**gRPC (Timestamp) → Frontend (ISO string):**

```javascript
// gRPC
{
  order_date: { seconds: 1710930600, nanos: 0 }
}

// API Gateway transforms to:
{
  orderDate: "2024-03-20T10:30:00.000Z"
}
```

### 3. ID Handling

**Frontend (string) → gRPC (UUID string):**

- Frontend sends: `"customer-123-abc"` (display ID)
- Gateway resolves to UUID: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
- gRPC receives UUID

---

## New Endpoints (Phase 3)

### Import Orders

**POST /api/v1/import-orders**

**Request Mapping:**

```javascript
// Frontend request
POST /api/v1/import-orders
{
  "supplierId": "SUP-123",
  "poNumber": "PO-2024-001",
  "poDate": "2024-03-15",
  "boeNumber": "BOE-2024-123456",
  "boeDate": "2024-03-16",
  "cooNumber": "COO-IN-2024-789",
  "cooIssuingCountry": "India",
  "freightCost": 5000.00,
  "autoBatchCreate": true,
  "millName": "Jindal Stainless",
  "heatNumber": "J304-2024-0123",
  "lcNumber": "LC-2024-001",
  "items": [
    {
      "productId": "PROD-001",
      "quantity": 10000,
      "unitPriceFob": 42.50,
      "hsCode": "721932",
      "dutyRate": 0.05
    }
  ]
}

// API Gateway → gRPC
CreateImportOrderRequest {
  supplier_id: "a1b2c3d4...",  // UUID resolved
  po_number: "PO-2024-001",
  po_date: { seconds: 1710460800, nanos: 0 },
  boe_number: "BOE-2024-123456",
  boe_date: { seconds: 1710547200, nanos: 0 },
  coo_number: "COO-IN-2024-789",
  coo_issuing_country: "India",
  freight_cost: 5000.00,
  auto_create_batch: true,
  mill_name: "Jindal Stainless",
  heat_number: "J304-2024-0123",
  lc_number: "LC-2024-001",
  items: [
    {
      product_id: "b2c3d4e5...",  // UUID resolved
      quantity: 10000,
      unit_price_fob: 42.50,
      hs_code: "721932",
      duty_rate: 0.05
    }
  ]
}
```

**Response Mapping:**

```javascript
// gRPC response
ImportOrder {
  id: "c3d4e5f6...",
  supplier_id: "a1b2c3d4...",
  po_number: "PO-2024-001",
  created_at: { seconds: 1710547200, nanos: 0 },
  // ... all fields
}

// API Gateway → Frontend
{
  "id": "IMP-2024-001",  // Display ID
  "supplierId": "SUP-123",  // Display ID
  "poNumber": "PO-2024-001",
  "createdAt": "2024-03-16T00:00:00.000Z",
  // ... all fields in camelCase
}
```

### Export Orders

**POST /api/v1/export-orders**

**Batch Allocation Mapping:**

```javascript
// Frontend
{
  "items": [
    {
      "productId": "PROD-001",
      "quantity": 5000,
      "batchAllocations": [
        {
          "batchId": "BATCH-001",
          "allocatedQty": 2000,
          "landedCost": 42.00
        },
        {
          "batchId": "BATCH-002",
          "allocatedQty": 3000,
          "landedCost": 44.50
        }
      ]
    }
  ]
}

// API Gateway → gRPC
items {
  product_id: "uuid-prod-001",
  quantity: 5000,
  batch_allocations: [
    {
      batch_id: "uuid-batch-001",
      allocated_qty: 2000,
      landed_cost: 42.00,
      procurement_date: { seconds: 1708128000, nanos: 0 }  // Fetched for FIFO
    },
    {
      batch_id: "uuid-batch-002",
      allocated_qty: 3000,
      landed_cost: 44.50,
      procurement_date: { seconds: 1710633600, nanos: 0 }
    }
  ]
}
```

### Stock Receipts

**POST /api/v1/stock-receipts**

**Weight Variance Calculation:**

```javascript
// Frontend
{
  "importOrderId": "IMP-2024-001",
  "invoicedWeight": 10000,
  "actualWeight": 9850
}

// API Gateway computes variance:
variance_kg = actual_weight - invoiced_weight  // -150
variance_percent = (variance_kg / invoiced_weight) * 100  // -1.5%

// API Gateway → gRPC
CreateStockReceiptRequest {
  import_order_id: "uuid-import-001",
  invoiced_weight: 10000,
  actual_weight: 9850,
  variance_kg: -150,
  variance_percent: -1.5,
  status: "AUTO_APPROVED"  // Because |variance| < 2%
}
```

### Price Lists

**POST /api/v1/price-lists**

**Margin Calculation & Validation:**

```javascript
// Frontend
{
  "productCategory": "COILS",
  "costPrice": 10000,
  "sellingPrice": 10500,
  "salesChannel": "IMPORTED"
}

// API Gateway computes:
margin_percent = ((selling_price - cost_price) / cost_price) * 100  // 5%
minimum_margin = salesChannel === 'IMPORTED' ? 8 : 5

// API Gateway validates:
if (margin_percent < minimum_margin) {
  warnings.push("Margin below threshold for IMPORTED channel (minimum 8%)")
}

// API Gateway → gRPC
CreatePriceListRequest {
  product_category: "COILS",
  pricing_unit: "WEIGHT_BASED",  // Auto-set from category
  cost_price: 10000,
  selling_price: 10500,
  margin_percent: 5.0,
  sales_channel: "IMPORTED",
  minimum_margin_threshold: 8.0,
  status: "PENDING_APPROVAL"  // Because margin < threshold
}
```

### Payments

**POST /api/v1/payments**

**Multi-Invoice Allocation:**

```javascript
// Frontend
{
  "customerId": "CUST-123",
  "paymentAmount": 50000,
  "paymentMethod": "BANK_TRANSFER",
  "invoiceAllocations": [
    {
      "invoiceId": "INV-001",
      "allocatedAmount": 21000
    },
    {
      "invoiceId": "INV-002",
      "allocatedAmount": 19000
    },
    {
      "invoiceId": "INV-003",
      "allocatedAmount": 10000
    }
  ]
}

// API Gateway enriches each allocation:
invoiceAllocations.forEach(alloc => {
  const invoice = fetchInvoice(alloc.invoiceId);

  alloc.invoiceTotal = invoice.total_amount;
  alloc.invoiceOutstanding = invoice.outstanding_amount;

  // Calculate VAT portion (pro-rata)
  alloc.vatPortion = alloc.allocatedAmount * (invoice.vat_amount / invoice.total_amount);
  alloc.principalPortion = alloc.allocatedAmount - alloc.vatPortion;
  alloc.remainingBalance = invoice.outstanding_amount - alloc.allocatedAmount;
});

// API Gateway → gRPC
CreatePaymentRequest {
  customer_id: "uuid-cust-123",
  payment_amount: 50000,
  payment_method: "BANK_TRANSFER",
  bank_account_id: "uuid-bank-001",  // Auto-selected based on method
  invoice_allocations: [
    {
      invoice_id: "uuid-inv-001",
      invoice_number: "INV-001",
      invoice_total: 21000,
      invoice_outstanding: 21000,
      allocated_amount: 21000,
      vat_portion: 1000,  // Calculated
      principal_portion: 20000,  // Calculated
      remaining_balance: 0
    },
    // ... etc
  ]
}
```

---

## Field Transformation Patterns

### Pattern 1: Enum Mapping

**Frontend (display) → gRPC (proto enum):**

```javascript
// Frontend: Shipment Type
const shipmentType = "Drop Ship"; // User-friendly label

// API Gateway transforms to proto enum:
SHIPMENT_TYPE_DROP_SHIP;

// Mapping table:
const SHIPMENT_TYPE_MAP = {
  Warehouse: "SHIPMENT_TYPE_WAREHOUSE",
  "Drop Ship": "SHIPMENT_TYPE_DROP_SHIP",
};
```

### Pattern 2: Nested Object Flattening

**Frontend (nested) → gRPC (flat):**

```javascript
// Frontend
{
  "customer": {
    "id": "CUST-123",
    "name": "ABC Industries",
    "trn": "100123456789012"
  }
}

// API Gateway → gRPC (flattened)
{
  customer_id: "uuid-cust-123",
  customer_name: "ABC Industries",  // Denormalized for display
  customer_trn: "100123456789012"
}
```

### Pattern 3: Array of Objects Transformation

**Frontend → gRPC (repeated fields):**

```javascript
// Frontend
{
  "items": [
    { "productId": "P1", "quantity": 100 },
    { "productId": "P2", "quantity": 200 }
  ]
}

// API Gateway → gRPC
items: [
  { product_id: "uuid-p1", quantity: 100 },
  { product_id: "uuid-p2", quantity: 200 }
]
```

---

## Company ID Enforcement (Multi-Tenancy)

**Every API Gateway request must inject `company_id`:**

```javascript
// Middleware: extractCompanyId
app.use((req, res, next) => {
  const companyId = req.user.company_id;  // From JWT token

  // Inject into request body
  if (req.body) {
    req.body.company_id = companyId;
  }

  // Inject into query params
  req.query.company_id = companyId;

  next();
});

// Example: Frontend calls GET /api/v1/export-orders
// API Gateway adds company_id filter:
ListExportOrdersRequest {
  company_id: "uuid-company-001",
  filters: { ... }
}
```

**Validation:**

- All write operations (POST, PUT, DELETE) must include `company_id`
- All read operations (GET) must filter by `company_id`
- Requests without valid `company_id` → 403 Forbidden

---

## Error Handling

### gRPC Error → HTTP Status Mapping

| gRPC Status         | HTTP Status               | Frontend Handling        |
| ------------------- | ------------------------- | ------------------------ |
| `OK`                | 200 OK                    | Success                  |
| `INVALID_ARGUMENT`  | 400 Bad Request           | Show field errors        |
| `NOT_FOUND`         | 404 Not Found             | Show "Not found" message |
| `ALREADY_EXISTS`    | 409 Conflict              | Show "Duplicate" error   |
| `PERMISSION_DENIED` | 403 Forbidden             | Redirect to login        |
| `UNAUTHENTICATED`   | 401 Unauthorized          | Redirect to login        |
| `INTERNAL`          | 500 Internal Server Error | Show generic error       |

### Field-Level Error Mapping

**gRPC field errors → React Hook Form errors:**

```javascript
// gRPC response
{
  code: INVALID_ARGUMENT,
  message: "Validation failed",
  details: [
    { field: "boe_number", message: "BOE number is required" },
    { field: "items[0].hs_code", message: "HS code must be 6-8 digits" }
  ]
}

// API Gateway → Frontend
{
  errors: {
    boeNumber: "BOE number is required",
    "items.0.hsCode": "HS code must be 6-8 digits"
  }
}

// React Hook Form consumes:
setError("boeNumber", { type: "server", message: "BOE number is required" });
setError("items.0.hsCode", { type: "server", message: "HS code must be 6-8 digits" });
```

---

## Performance Optimizations

### 1. Response Pagination

**Frontend request:**

```javascript
GET /api/v1/export-orders?page=1&limit=50
```

**API Gateway → gRPC:**

```protobuf
ListExportOrdersRequest {
  company_id: "uuid-company-001",
  page_number: 1,
  page_size: 50
}
```

**gRPC → API Gateway:**

```protobuf
ListExportOrdersResponse {
  export_orders: [ ... ],
  total_count: 1234,
  page_number: 1,
  page_size: 50,
  total_pages: 25
}
```

### 2. Field Selection (Sparse Fieldsets)

**Frontend request (only needed fields):**

```javascript
GET /api/v1/export-orders?fields=id,orderNumber,customer.name,totalAmount
```

**API Gateway → gRPC (field mask):**

```protobuf
ListExportOrdersRequest {
  field_mask: {
    paths: ["id", "order_number", "customer_name", "total_amount"]
  }
}
```

**Benefit:** Reduces payload size by ~60-70% for list views.

---

## Middleware Stack

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
└──────────────┬──────────────────────────┘
               │ HTTP/JSON (camelCase)
               ↓
┌─────────────────────────────────────────┐
│      API Gateway (Node.js/Express)      │
│  ┌───────────────────────────────────┐  │
│  │  1. Authentication (JWT verify)   │  │
│  │  2. Company ID injection          │  │
│  │  3. Request validation (Zod)      │  │
│  │  4. Case conversion (camel→snake) │  │
│  │  5. ID resolution (display→UUID)  │  │
│  │  6. Timestamp normalization       │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ gRPC (snake_case)
               ↓
┌─────────────────────────────────────────┐
│       gRPC Services (Go/Java/Python)    │
└──────────────┬──────────────────────────┘
               │ SQL
               ↓
┌─────────────────────────────────────────┐
│       PostgreSQL Database               │
└─────────────────────────────────────────┘
```

---

## Summary

**Phase 3 API Gateway Changes:**

- 8 new endpoints (import-orders, export-orders, stock-receipts, price-lists, reservations, transfers, payments, batches)
- 150+ field mappings (camelCase ↔ snake_case)
- Batch allocation enrichment (FIFO procurement dates)
- Multi-invoice allocation calculations (VAT pro-rata)
- Weight variance calculations
- Margin validation and warnings
- Company ID multi-tenancy enforcement
- Error field mapping for React Hook Form

---

**End of API Gateway Mapping Guide**
