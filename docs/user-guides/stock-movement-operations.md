# Stock Movement Operations Guide

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Warehouse Staff, Stock Controllers, Operations Team

---

## Overview

This guide covers all stock movement operations including GRN workflow, batch allocation (FIFO), reservations, inter-warehouse transfers, and drop-ship fulfillment.

---

## Part 1: GRN Workflow & Stock Receipt (Epic 3, 15)

### What is GRN?

**GRN (Goods Receipt Note)** is a formal document confirming receipt of goods into the warehouse.

**Automatic Creation:**
- When you create a **Stock Receipt** from an **Import Order**, the system auto-generates a GRN
- GRN number format: GRN-YYYY-NNNNNN
- GRN links to BOE, COO, and HS codes from import order

### Stock Receipt Form Fields

#### Basic Information
- **GRN Number:** Auto-generated (read-only)
- **Import Order Reference:** Select from pending import orders
- **Receipt Date:** Date goods physically received
- **Receiving Clerk:** User who physically checked the goods

#### Weight Variance Tracking (Epic 3)

**Problem:** Supplier invoiced 10,000 KG, but warehouse scales show 9,850 KG.

**Solution:** Weight variance tracking.

**Fields:**
- **Invoiced Weight:** From supplier invoice/packing list
- **Actual Weight:** Measured on warehouse scales
- **Variance (KG):** System calculates (Actual - Invoiced)
- **Variance (%):** System calculates ((Actual - Invoiced) / Invoiced × 100)

**Tolerance Thresholds:**
- ±2% → Acceptable (auto-approve)
- >2% to 5% → Warning (requires manager approval)
- >5% → Rejected (investigation required)

**Example:**
```
Product: 304 SS Coil 2mm
Invoiced Weight: 10,000 KG
Actual Weight: 9,850 KG
Variance: -150 KG
Variance %: -1.5%
Status: ✅ Acceptable (within ±2%)

Product: 316L SS Sheet 3mm
Invoiced Weight: 5,000 KG
Actual Weight: 4,700 KG
Variance: -300 KG
Variance %: -6.0%
Status: ❌ REJECTED (exceeds 5% threshold)
Action: Contact supplier for credit note
```

#### Batch Association (Epic 6)

**Batch Creation:**
- **Auto-create batch?** (Checkbox, default: YES)
- If YES, system creates batch with:
  - Batch Number: AUTO-GENERATED (BATCH-YYYY-NNNNNN)
  - Procurement Date: Receipt date
  - Supplier Reference: From import order
  - Mill Reference: From import order (Epic 12)
  - Heat Number: From import order
  - Landed Cost: Allocated from import order

**Manual Batch Entry:**
- Uncheck "Auto-create batch"
- Select existing batch from dropdown
- Use case: Adding to existing batch

**Example:**
```
Import Order: IMP-2024-001
Product: 304 SS Coil 2mm
Quantity: 10,000 KG

Auto-create batch: ✅ YES

System creates:
  Batch Number: BATCH-2024-000123
  Procurement Date: 2024-03-20
  Supplier: Indian Steel Ltd
  Mill: Jindal Stainless, Hisar
  Heat Number: J304-2024-0123
  Landed Cost: 45.50 AED/KG (FOB + freight + duty)
```

#### Quality & Exceptions (Epic 15)

**Quality Inspection:**
- **Inspection Required?** (from import order)
- **Inspection Status:** Pending/Passed/Failed
- **Inspector:** Name of quality inspector
- **Inspection Date:** Date of inspection
- **Inspection Certificate:** Upload PDF

**Damage & Shortage Reporting:**
- **Damage Reported?** (Checkbox)
- **Damage Description:** Text area (e.g., "10 coils have surface rust")
- **Damage Quantity:** KG/PCS affected
- **Damage Photos:** Upload images

- **Shortage Reported?** (Checkbox)
- **Shortage Description:** Text area (e.g., "1 coil missing from container")
- **Shortage Quantity:** KG/PCS short

**Receiving Clerk Accountability:**
- **Received By:** Dropdown (warehouse staff)
- **Signature:** Digital signature (if enabled)
- **Notes:** Additional comments

**Example:**
```
Inspection Required: YES
Inspection Status: Passed
Inspector: Ahmed Khan
Inspection Date: 2024-03-21
Certificate: SGS-2024-789.pdf

Damage Reported: YES
Description: "3 coils have minor edge damage (cosmetic)"
Damage Quantity: 300 KG
Action: Segregated for secondary grade sale

Shortage Reported: NO

Received By: Mohammed Ali (Warehouse Clerk)
Notes: "Container seal intact. No issues during unloading."
```

### GRN Approval Workflow

**Status Flow:**
1. **Draft** → Created, not yet submitted
2. **Pending Approval** → Submitted for warehouse manager review
3. **Approved** → Manager approved, stock added to inventory
4. **Rejected** → Manager rejected (variance too high, damage excessive)

**Approval Trigger:**
- Variance >2% → Requires approval
- Damage reported → Requires approval
- Shortage reported → Requires approval
- Quality inspection failed → Auto-rejected

**Manager Actions:**
- **Approve:** Stock added to available inventory
- **Reject:** Stock held in "Pending" status, requires resolution

---

## Part 2: Batch Allocation & FIFO (Epic 4)

### What is FIFO?

**FIFO (First-In-First-Out)** ensures oldest stock is used first, preventing obsolescence and maintaining cost consistency.

**Algorithm:**
1. Sort all available batches by **Procurement Date** (oldest first)
2. Allocate from oldest batch until exhausted
3. Move to next oldest batch
4. Repeat until order fulfilled

### FIFO in Export Orders

**Scenario:** Customer orders 5,000 KG of 304 SS Coil 2mm.

**Available Batches:**

| Batch | Procurement Date | Available Qty | Landed Cost |
|-------|------------------|---------------|-------------|
| BATCH-001 | 2024-01-15 | 2,000 KG | 42.00 AED/KG |
| BATCH-002 | 2024-02-20 | 3,500 KG | 44.50 AED/KG |
| BATCH-003 | 2024-03-10 | 4,000 KG | 46.00 AED/KG |

**FIFO Allocation:**
1. Allocate 2,000 KG from BATCH-001 (oldest)
2. Allocate 3,000 KG from BATCH-002 (next oldest)
3. Total allocated: 5,000 KG
4. BATCH-003 remains untouched

**Weighted Average Cost:**
```
Total Cost = (2,000 × 42.00) + (3,000 × 44.50)
           = 84,000 + 133,500
           = 217,500 AED

Weighted Avg = 217,500 / 5,000 = 43.50 AED/KG
```

**Why FIFO Matters:**
- Ensures older stock moves first (reduces risk of obsolescence)
- Provides accurate COGS (Cost of Goods Sold)
- Maintains traceability (batch → heat number → mill)

### FIFO in Reservations

**Use Case:** Sales order confirmed, but delivery next month. Reserve stock now.

**Process:**
1. Create reservation for 3,000 KG
2. System applies FIFO and reserves oldest batches
3. Stock status changes: Available → Reserved
4. Reserved stock cannot be allocated to other orders

**Expiry & Auto-Release (Epic 10):**
- Set **Expiry Date** (e.g., 30 days from now)
- If sales order cancelled before expiry, manually release reservation
- If expiry date reached, system auto-releases (stock → Available)

**Example:**
```
Reservation: RES-2024-001
Product: 316L SS Sheet 3mm
Quantity: 3,000 KG
Reason: "Sales Order SO-2024-123"
Expiry Date: 2024-05-15

FIFO Allocation:
  BATCH-010 (2024-01-10): 1,500 KG → RESERVED
  BATCH-015 (2024-02-05): 1,500 KG → RESERVED

Status: Reserved until 2024-05-15 or manual release
```

### FIFO in Transfers

**Use Case:** Transfer 4,000 KG from Dubai warehouse to Abu Dhabi warehouse.

**Process:**
1. Create transfer order (source: Dubai, destination: Abu Dhabi)
2. System applies FIFO to Dubai warehouse batches
3. Oldest batches selected for transfer
4. After approval and receipt, batches moved to Abu Dhabi

**Batch Chain Maintained:**
- Batch number stays the same
- Procurement date preserved
- Landed cost preserved
- Warehouse location updated

---

## Part 3: Reservations (Epic 10)

### Creating a Reservation

**When to Reserve:**
- Confirmed sales order, delivery later
- Customer hold (paid deposit, awaiting delivery)
- Quality hold (pending re-inspection)
- Management hold (pricing negotiation in progress)

**Fields:**
- **Product:** Select product (unique_name)
- **Quantity:** KG/MT/PCS to reserve
- **Reason:** Dropdown (Sales Order, Customer Hold, Quality Hold, Other)
- **Reference:** Sales order number or customer name
- **Expiry Date:** Auto-release if not used by this date
- **Created By:** User creating reservation

**FIFO Pre-Selection:**
- System auto-selects oldest batches
- User can override (select specific batches manually)
- Reason for override must be documented

**Example:**
```
Product: 304 SS Pipe 2" SCH 40
Quantity: 500 MTR
Reason: Sales Order
Reference: SO-2024-456
Expiry Date: 2024-06-30
Created By: Salim Ahmed

FIFO Auto-Selected:
  BATCH-050 (2024-02-01): 300 MTR
  BATCH-055 (2024-02-15): 200 MTR

Status: RESERVED
```

### Managing Reservations

**Actions:**
- **Release:** Manually release reserved stock (returns to Available)
- **Convert to Order:** Create export order from reservation (auto-allocates)
- **Extend Expiry:** Extend expiry date (requires approval)
- **Cancel:** Cancel reservation (auto-releases stock)

**Reporting:**
- View all active reservations by product
- View expiring reservations (next 7 days)
- View reservation history by customer

---

## Part 4: Inter-Warehouse Transfers (Epic 10)

### Transfer Workflow

**Scenario:** Dubai warehouse has excess 316L sheets. Abu Dhabi warehouse needs them urgently.

#### Step 1: Create Transfer Order

**Fields:**
- **From Warehouse:** Dubai Main Warehouse
- **To Warehouse:** Abu Dhabi Branch
- **Transfer Type:** REGULAR / URGENT / QUALITY_HOLD
- **Transfer Date:** Planned transfer date
- **Transporter:** Select transporter or enter name
- **Vehicle Number:** Truck plate number
- **Driver Name:** Driver name
- **Driver Contact:** Mobile number

**Line Items:**
- Product
- Quantity
- Batch(es) to transfer (FIFO pre-selected)

**Example:**
```
Transfer Order: TRN-2024-001
From: Dubai Main Warehouse
To: Abu Dhabi Branch
Type: URGENT
Transfer Date: 2024-04-05
Transporter: Emirates Transport LLC
Vehicle: DXB-12345
Driver: Rajesh Kumar
Contact: +971-50-123-4567

Line Items:
  316L SS Sheet 3mm
  Quantity: 2,000 KG
  Batches:
    BATCH-070 (2024-01-20): 1,200 KG
    BATCH-075 (2024-02-10): 800 KG
```

#### Step 2: Approval

**Approval Required for:**
- Transfers >5,000 KG
- URGENT transfers
- QUALITY_HOLD transfers

**Manager Reviews:**
- Stock availability at source
- Business justification
- Transporter details

**Actions:**
- **Approve:** Status → Approved, ready for dispatch
- **Reject:** Status → Rejected, provide reason

#### Step 3: Dispatch (In-Transit)

**Warehouse Clerk Actions:**
1. Physical loading of goods
2. Click "Mark In-Transit"
3. **Departure Time:** Auto-captured
4. Transporter departs

**Status:** IN_TRANSIT

**Example:**
```
Status: IN_TRANSIT
Departed: 2024-04-05 08:30 AM
Estimated Arrival: 2024-04-05 12:00 PM (3.5 hours)
```

#### Step 4: Receipt at Destination

**Warehouse Clerk (Abu Dhabi) Actions:**
1. Physical unloading and verification
2. Click "Confirm Receipt"
3. **Arrival Time:** Auto-captured
4. **Transit Duration:** System calculates

**Status:** COMPLETED

**Stock Movement:**
- Deducted from Dubai warehouse
- Added to Abu Dhabi warehouse
- Batch association maintained

**Example:**
```
Status: COMPLETED
Arrived: 2024-04-05 11:45 AM
Transit Duration: 3 hours 15 minutes
Received By: Ali Hassan (Abu Dhabi Warehouse)

Stock Updated:
  Dubai: -2,000 KG
  Abu Dhabi: +2,000 KG
  Batches: BATCH-070, BATCH-075 (now in Abu Dhabi)
```

### Transfer Types

| Type | Use Case | Approval? | Priority |
|------|----------|-----------|----------|
| **REGULAR** | Normal stock balancing | Auto (if <5,000 KG) | Standard |
| **URGENT** | Customer order fulfillment | Required | High |
| **QUALITY_HOLD** | Segregation for re-inspection | Required | Standard |

### Transporter Accountability

**Why Track Transporter:**
- Damage accountability during transit
- Delivery time monitoring
- Transporter performance tracking

**Reports:**
- Transporter Performance Report (on-time %, damage %)
- Transfer History by Transporter
- Transit Duration Analysis

---

## Part 5: Drop-Ship & Shipment Types (Epic 7)

### What is Drop-Ship?

**Drop-Ship:** Supplier ships directly to customer, bypassing your warehouse.

**When to Use:**
- Customer orders item you don't stock
- Urgent delivery (no time for warehouse handling)
- Bulky items (save double handling)

### Shipment Types

| Type | Description | Stock Deduction? | Use Case |
|------|-------------|------------------|----------|
| **WAREHOUSE** | Ship from your warehouse | YES | Standard orders |
| **DROP_SHIP** | Supplier ships direct | NO | Special orders |

### Drop-Ship Workflow (Export Order)

#### Step 1: Create Export Order

**Fields:**
- Customer: Select customer
- **Shipment Type:** DROP_SHIP (select from dropdown)
- Line Items: Add products

**System Behavior:**
- Stock deduction: SKIPPED (no warehouse stock used)
- Supplier: Must select supplier per line item
- Delivery address: Customer address (not warehouse)

**Example:**
```
Export Order: EXP-2024-050
Customer: ABC Industries LLC
Shipment Type: DROP_SHIP

Line Items:
  Product: 310S SS Coil 4mm (special grade)
  Quantity: 3,000 KG
  Supplier: Premium Steel India
  Delivery To: ABC Industries, Sharjah
  Stock Deduction: NO (drop-ship)
```

#### Step 2: Supplier Coordination

**Purchase Order:**
- Create PO to supplier
- Delivery address: Customer address (not your warehouse)
- Delivery timeline: Coordinated with customer

**Logistics:**
- Supplier arranges shipping
- BOE and COO handled by supplier (or your customs broker)
- Direct delivery to customer

#### Step 3: Invoice & Payment

**Customer Invoice:**
- Generated as normal (you bill customer)
- No warehouse delivery note (drop-ship note instead)

**Supplier Payment:**
- Pay supplier after customer confirms receipt
- No stock receipt in your ERP (drop-ship flag)

### Warehouse vs. Drop-Ship Comparison

| Aspect | WAREHOUSE | DROP_SHIP |
|--------|-----------|-----------|
| Stock deduction | YES | NO |
| Delivery from | Your warehouse | Supplier direct |
| Warehouse handling | YES | NO |
| Stock receipt in ERP | YES | NO |
| Customer visibility | Standard | Must inform customer |
| Customs clearance | You handle | Supplier/customer handles |
| Lead time | Faster (stock ready) | Slower (depends on supplier) |

---

## Part 6: Common Scenarios

### Scenario 1: Handling Weight Variance

**Problem:** Container received, weight 5% short.

**Steps:**
1. Create stock receipt
2. Enter invoiced weight: 10,000 KG
3. Enter actual weight: 9,500 KG
4. System calculates variance: -5.0%
5. Status: ❌ REJECTED (exceeds threshold)
6. Action:
   - Contact supplier for credit note
   - Manager approves receipt with adjustment
   - Invoice adjusted for 9,500 KG

### Scenario 2: Emergency Transfer

**Problem:** Abu Dhabi customer needs 2,000 KG urgently. Abu Dhabi warehouse has 500 KG, Dubai has 5,000 KG.

**Steps:**
1. Create transfer order (Dubai → Abu Dhabi)
2. Type: URGENT
3. Quantity: 1,500 KG (to supplement 500 KG existing)
4. Manager approves (urgent)
5. Same-day dispatch and receipt
6. Customer order fulfilled from Abu Dhabi

### Scenario 3: Batch Traceability

**Problem:** Customer reports quality issue. Which mill and heat number?

**Steps:**
1. Locate sale in export order: EXP-2024-050
2. Check allocated batches: BATCH-100
3. Batch details:
   - Mill: Jindal Stainless, Hisar
   - Heat Number: J316L-2024-0567
   - Procurement Date: 2024-02-10
   - Supplier: Indian Steel Ltd
4. Contact mill with heat number for investigation

---

## Part 7: Best Practices

### Stock Receipt
✅ Always verify weight on calibrated scales
✅ Report all damage/shortage immediately
✅ Take photos of damaged goods
✅ Auto-create batches for traceability
✅ Enter mill and heat numbers from MTC

### Batch Allocation
✅ Use FIFO unless specific reason to override
✅ Document reason for manual batch selection
✅ Check batch expiry before allocation
✅ Reserve stock for confirmed orders

### Transfers
✅ Plan transfers in advance (avoid urgent)
✅ Use reliable transporters
✅ Verify vehicle and driver details
✅ Confirm receipt promptly

### Drop-Ship
✅ Inform customer about direct delivery
✅ Coordinate delivery timeline with supplier
✅ Track shipment status
✅ Confirm receipt before invoicing

---

## Part 8: Reports

**Available Stock Reports:**
- Stock Summary by Product
- Stock by Warehouse
- Stock by Batch (FIFO sequence)
- Reserved Stock Report
- Aging Stock Report (slow-moving)

**GRN Reports:**
- GRN Summary (pending approvals)
- Weight Variance Report
- Damage & Shortage Report
- Quality Inspection Status

**Transfer Reports:**
- Pending Transfers
- In-Transit Transfers
- Transfer History by Warehouse
- Transporter Performance

---

## Support

For stock movement issues:
- **Warehouse Manager:** GRN approvals, transfers
- **Stock Controller:** Batch allocation, reservations
- **IT Support:** System errors, performance

---

**End of Stock Movement Operations Guide**
