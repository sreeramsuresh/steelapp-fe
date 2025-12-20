# Proto Field Reference - Phase 3 Updates

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Backend Developers, API Gateway Developers

---

## Overview

This document catalogs all proto field additions and modifications made during Phase 3 implementation (15 epics, 180-230 hours of work).

---

## Import Order Proto

**File:** `import_order.proto`

### New Fields (Phase 3)

```protobuf
message ImportOrder {
  // Existing fields...
  string id = 1;
  string supplier_id = 2;
  string po_number = 3;
  google.protobuf.Timestamp po_date = 4;

  // Epic 1: Customs Compliance
  string boe_number = 20;
  google.protobuf.Timestamp boe_date = 21;
  string port_of_entry = 22;
  string customs_office_code = 23;
  google.protobuf.Timestamp assessment_date = 24;

  string coo_number = 25;
  string coo_issuing_country = 26;
  string coo_issuing_authority = 27;
  google.protobuf.Timestamp coo_issue_date = 28;
  string coo_type = 29; // FORM_A, FORM_E, NON_PREFERENTIAL

  // Epic 6: Landed Cost
  double freight_cost = 30;
  double total_duty = 31;
  double total_landed_cost = 32;
  bool auto_create_batch = 33; // Default: true

  // Epic 12: Import Procurement Details
  string mill_name = 40;
  string mill_location = 41;
  string heat_number = 42;
  string mtc_reference = 43;

  bool quality_inspection_required = 44;
  string inspection_agency = 45;
  string inspection_location = 46; // ORIGIN, DESTINATION
  google.protobuf.Timestamp inspection_date = 47;
  string inspection_certificate_ref = 48;

  string lc_number = 50;
  string lc_issuing_bank = 51;
  double lc_amount = 52;
  google.protobuf.Timestamp lc_expiry = 53;
  string lc_type = 54; // SIGHT, USANCE

  // Epic 9: VAT & Audit
  double vat_amount = 60;
  string vat_treatment = 61; // REVERSE_CHARGE
  string created_by = 62;
  google.protobuf.Timestamp created_at = 63;
  string approved_by = 64;
  google.protobuf.Timestamp approved_at = 65;

  repeated ImportOrderItem items = 100;
}

message ImportOrderItem {
  string product_id = 1;
  double quantity = 2;
  double unit_price_fob = 3;

  // Epic 1: HS Code per item
  string hs_code = 10;
  string hs_description = 11;
  double duty_rate = 12;
  double duty_amount = 13;

  // Epic 6: Landed cost per item
  double allocated_freight = 20;
  double allocated_duty = 21;
  double landed_cost_per_unit = 22;
}
```

**Field Constraints:**

| Field | Type | Required? | Validation |
|-------|------|-----------|------------|
| `boe_number` | string | YES (Epic 1) | Format: `BOE-YYYY-NNNNNN` |
| `coo_number` | string | YES (Epic 1) | Unique |
| `hs_code` | string | YES (Epic 1) | 6-8 digits |
| `freight_cost` | double | YES (Epic 6) | ≥ 0 |
| `mill_name` | string | NO (Epic 12) | Max 255 chars |
| `lc_number` | string | NO (Epic 12) | If provided, must be valid |

---

## Export Order Proto

**File:** `export_order.proto`

### New Fields (Phase 3)

```protobuf
message ExportOrder {
  // Existing fields...
  string id = 1;
  string customer_id = 2;
  string order_number = 3;
  google.protobuf.Timestamp order_date = 4;

  // Epic 1: Export Documentation
  string customer_trn = 20; // Tax Registration Number
  double vat_rate = 21; // 0.00 (export/zone), 0.05 (UAE mainland)
  double vat_amount = 22;

  // Epic 13: COO & HS Codes
  bool coo_required = 30;
  string coo_number = 31;
  string coo_issuing_authority = 32;
  google.protobuf.Timestamp coo_issue_date = 33;

  // Epic 7: Shipment Type
  string shipment_type = 40; // WAREHOUSE, DROP_SHIP

  // Epic 9: Audit Trails
  string created_by = 50;
  google.protobuf.Timestamp created_at = 51;
  string approved_by = 52;
  google.protobuf.Timestamp approved_at = 53;

  repeated ExportOrderItem items = 100;
}

message ExportOrderItem {
  string product_id = 1;
  double quantity = 2;
  double unit_price = 3;

  // Epic 4: Batch Allocation
  repeated BatchAllocation batch_allocations = 10;

  // Epic 13: HS Code per item
  string hs_code = 20;
  string export_statistical_code = 21;

  // Epic 7: Drop-Ship Supplier
  string supplier_id = 30; // Required if shipment_type = DROP_SHIP
}

message BatchAllocation {
  string batch_id = 1;
  string batch_number = 2;
  double allocated_qty = 3;
  double landed_cost = 4;
  google.protobuf.Timestamp procurement_date = 5; // For FIFO sorting
}
```

---

## Stock Receipt Proto

**File:** `stock_receipt.proto`

### New Fields (Phase 3)

```protobuf
message StockReceipt {
  string id = 1;
  string grn_number = 2; // Auto-generated
  string import_order_id = 3;
  google.protobuf.Timestamp receipt_date = 4;

  // Epic 3: Weight Variance Tracking
  double invoiced_weight = 10;
  double actual_weight = 11;
  double variance_kg = 12; // Calculated: actual - invoiced
  double variance_percent = 13; // Calculated: (variance_kg / invoiced_weight) * 100

  // Epic 15: Quality & Exceptions
  bool inspection_required = 20;
  string inspection_status = 21; // PENDING, PASSED, FAILED
  string inspector_name = 22;
  google.protobuf.Timestamp inspection_date = 23;
  string inspection_certificate_url = 24;

  bool damage_reported = 30;
  string damage_description = 31;
  double damage_quantity = 32;
  repeated string damage_photo_urls = 33;

  bool shortage_reported = 40;
  string shortage_description = 41;
  double shortage_quantity = 42;

  // Epic 15: Receiving Clerk Accountability
  string received_by = 50; // User ID of warehouse clerk
  string receiving_notes = 51;

  // Epic 6: Batch Association
  bool auto_create_batch = 60; // Default: true
  string batch_id = 61; // If auto_create_batch = false, select existing

  // Epic 3: Approval Workflow
  string status = 70; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
  string approved_by = 71;
  google.protobuf.Timestamp approved_at = 72;
  string rejection_reason = 73;

  repeated StockReceiptItem items = 100;
}

message StockReceiptItem {
  string product_id = 1;
  double quantity_received = 2;
  string batch_number = 3;
}
```

**Approval Logic:**

| Condition | Status | Requires Approval? |
|-----------|--------|--------------------|
| Variance ≤ 2% | AUTO_APPROVED | NO |
| Variance > 2% and ≤ 5% | PENDING_APPROVAL | YES |
| Variance > 5% | REJECTED | YES (investigation) |
| Damage reported | PENDING_APPROVAL | YES |
| Shortage reported | PENDING_APPROVAL | YES |
| Inspection failed | REJECTED | YES |

---

## Price List Proto

**File:** `price_list.proto`

### New Fields (Phase 3)

```protobuf
message PriceList {
  string id = 1;
  string name = 2;

  // Epic 8: Category-Based Strategy
  string product_category = 10; // COILS, SHEETS, PIPES_TUBES, FITTINGS, BARS_RODS
  string pricing_unit = 11; // WEIGHT_BASED, LENGTH_BASED, PER_PIECE (auto-set from category)

  // Epic 2: Cost Validation
  double cost_price = 20;
  double selling_price = 21;
  double margin_percent = 22; // Calculated
  string sales_channel = 23; // LOCAL, IMPORTED, EXPORT
  double minimum_margin_threshold = 24; // 5% for LOCAL, 8% for IMPORTED

  // Epic 14: Effective Dates & Multi-Currency
  google.protobuf.Timestamp effective_start_date = 30;
  google.protobuf.Timestamp effective_end_date = 31;

  string cost_currency = 40; // USD, AED, EUR
  string selling_currency = 41;
  double exchange_rate = 42;
  double normalized_margin_aed = 43; // Margin in AED equivalent

  // Epic 8: Approval Workflow
  string status = 50; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
  string created_by = 51;
  google.protobuf.Timestamp created_at = 52;
  string approved_by = 53;
  google.protobuf.Timestamp approved_at = 54;
  string rejection_reason = 55;

  repeated PriceListItem items = 100;
}

message PriceListItem {
  string product_id = 1;
  double cost_price = 2;
  double selling_price = 3;
  double margin_percent = 4;
}
```

---

## Reservation Proto

**File:** `reservation.proto`

### New Fields (Phase 3)

```protobuf
message Reservation {
  string id = 1;
  string reservation_number = 2; // AUTO-GENERATED

  string product_id = 10;
  double quantity = 11;
  string warehouse_id = 12;

  // Epic 10: Reservation Details
  string reason = 20; // SALES_ORDER, CUSTOMER_HOLD, QUALITY_HOLD, OTHER
  string reference = 21; // Sales order number or customer name
  google.protobuf.Timestamp expiry_date = 22; // Auto-release if not used by this date

  // Epic 4: Batch Allocation (FIFO)
  repeated BatchAllocation batch_allocations = 30;

  string status = 40; // ACTIVE, RELEASED, EXPIRED, CONVERTED_TO_ORDER
  string created_by = 41;
  google.protobuf.Timestamp created_at = 42;
}
```

---

## Transfer Order Proto

**File:** `transfer_order.proto`

### New Fields (Phase 3)

```protobuf
message TransferOrder {
  string id = 1;
  string transfer_number = 2; // AUTO-GENERATED

  string from_warehouse_id = 10;
  string to_warehouse_id = 11;

  // Epic 10: Transfer Type & Transporter
  string transfer_type = 20; // REGULAR, URGENT, QUALITY_HOLD
  google.protobuf.Timestamp transfer_date = 21;

  string transporter_name = 30;
  string vehicle_number = 31;
  string driver_name = 32;
  string driver_contact = 33;

  // Epic 10: Approval Workflow
  string status = 40; // DRAFT, PENDING_APPROVAL, APPROVED, IN_TRANSIT, COMPLETED, REJECTED
  string approved_by = 41;
  google.protobuf.Timestamp approved_at = 42;

  // Epic 10: Transit Tracking
  google.protobuf.Timestamp departure_time = 50;
  google.protobuf.Timestamp arrival_time = 51;
  int32 transit_duration_minutes = 52; // Calculated

  string created_by = 60;
  google.protobuf.Timestamp created_at = 61;

  repeated TransferOrderItem items = 100;
}

message TransferOrderItem {
  string product_id = 1;
  double quantity = 2;

  // Epic 4: Batch Allocation (FIFO maintained across warehouses)
  repeated BatchAllocation batch_allocations = 10;
}
```

---

## Payment Proto

**File:** `payment.proto`

### New Fields (Phase 3)

```protobuf
message Payment {
  string id = 1;
  string payment_number = 2; // AUTO-GENERATED

  string customer_id = 10;
  double payment_amount = 11;
  google.protobuf.Timestamp payment_date = 12;

  // Epic 11: Payment Method & Bank Routing
  string payment_method = 20; // CASH, CHEQUE, BANK_TRANSFER, CARD, PDC
  string bank_account_id = 21; // Auto-selected based on payment method
  string reference_number = 22; // Cheque no., transfer ref., card approval

  // Epic 11: PDC Handling
  google.protobuf.Timestamp cheque_date = 30; // For PDC
  string cheque_bank = 31;
  string pdc_status = 32; // PENDING, CLEARED, BOUNCED

  // Epic 11: Multi-Invoice Allocation
  repeated InvoiceAllocation invoice_allocations = 40;

  // Epic 11: Credit Limit Tracking
  double customer_credit_limit = 50;
  double credit_exposure_before = 51;
  double credit_exposure_after = 52;

  string created_by = 60;
  google.protobuf.Timestamp created_at = 61;
}

message InvoiceAllocation {
  string invoice_id = 1;
  string invoice_number = 2;
  double invoice_total = 3;
  double invoice_outstanding = 4;
  double allocated_amount = 5;
  double vat_portion = 6; // Calculated: allocated_amount × (vat_amount / invoice_total)
  double principal_portion = 7; // Calculated: allocated_amount - vat_portion
  double remaining_balance = 8; // invoice_outstanding - allocated_amount
}
```

---

## Batch Proto

**File:** `batch.proto`

### New Fields (Phase 3)

```protobuf
message Batch {
  string id = 1;
  string batch_number = 2; // AUTO-GENERATED: BATCH-YYYY-NNNNNN

  string product_id = 10;
  string warehouse_id = 11;

  // Epic 6: Procurement & Landed Cost
  google.protobuf.Timestamp procurement_date = 20; // For FIFO sorting
  string supplier_id = 21;
  string supplier_reference = 22;

  string mill_name = 30; // From import order
  string heat_number = 31; // From import order

  double quantity_received = 40;
  double quantity_available = 41;
  double quantity_reserved = 42;
  double quantity_allocated = 43;

  // Epic 6: Landed Cost
  double fob_cost_per_unit = 50;
  double freight_cost_per_unit = 51;
  double duty_cost_per_unit = 52;
  double landed_cost_per_unit = 53; // fob + freight + duty

  string created_by = 60;
  google.protobuf.Timestamp created_at = 61;
}
```

---

## Summary: Total Field Additions

| Proto Message | New Fields (Phase 3) | Epics Involved |
|---------------|----------------------|----------------|
| ImportOrder | 30+ fields | 1, 6, 9, 12 |
| ExportOrder | 15+ fields | 1, 4, 7, 9, 13 |
| StockReceipt | 25+ fields | 3, 6, 15 |
| PriceList | 20+ fields | 2, 8, 14 |
| Reservation | 10+ fields | 4, 10 |
| TransferOrder | 20+ fields | 4, 10 |
| Payment | 15+ fields | 11 |
| Batch | 15+ fields | 4, 6 |

**Grand Total:** 150+ new proto fields across 8 message types.

---

## Data Type Reference

| Proto Type | JavaScript Type | PostgreSQL Type |
|------------|-----------------|-----------------|
| `string` | `string` | `VARCHAR`, `TEXT` |
| `double` | `number` | `NUMERIC`, `DECIMAL` |
| `int32` | `number` | `INTEGER` |
| `bool` | `boolean` | `BOOLEAN` |
| `google.protobuf.Timestamp` | `Date` / ISO string | `TIMESTAMPTZ` |
| `repeated` | `Array` | `JSONB[]` or separate table |

---

## Naming Convention Summary

**Proto (snake_case):**
```protobuf
string customer_id = 1;
double vat_rate = 2;
google.protobuf.Timestamp created_at = 3;
```

**JavaScript/React (camelCase):**
```javascript
const customerId = '123';
const vatRate = 0.05;
const createdAt = new Date();
```

**PostgreSQL (snake_case):**
```sql
customer_id VARCHAR(36),
vat_rate NUMERIC(5,4),
created_at TIMESTAMPTZ
```

---

**End of Proto Field Reference**
