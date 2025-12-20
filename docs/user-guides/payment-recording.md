# Payment Recording Guide

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Accounts Receivable Team, Finance Department

---

## Overview

This guide covers payment recording with multi-invoice allocation, credit limit validation, payment terms enforcement, and VAT tracking.

---

## Part 1: Payment Form Overview (Epic 11)

### Key Features

1. **Multi-Invoice Allocation:** Allocate one payment across multiple invoices
2. **Credit Limit Validation:** Real-time credit exposure checks
3. **Payment Terms Validation:** Ensure payment terms match customer master
4. **VAT Tracking:** Separate VAT amount from principal
5. **Bank Account Routing:** Select correct bank account per payment method

---

## Part 2: Multi-Invoice Allocation

### The Problem

**Scenario:** Customer pays 50,000 AED. They have 3 outstanding invoices:
- INV-001: 20,000 AED
- INV-002: 18,500 AED
- INV-003: 15,000 AED

**Question:** How to allocate the 50,000 AED?

### The Solution: Allocation Table

**Payment Form includes allocation table:**

| Invoice No. | Invoice Date | Due Date | Original Amt | Outstanding | VAT | Allocated | Balance |
|-------------|--------------|----------|--------------|-------------|-----|-----------|---------|
| INV-001 | 2024-02-15 | 2024-03-17 | 21,000 | 21,000 | 1,000 | 21,000 | 0 |
| INV-002 | 2024-03-10 | 2024-04-09 | 19,435 | 19,435 | 935 | 19,000 | 435 |
| INV-003 | 2024-03-25 | 2024-04-24 | 15,750 | 15,750 | 750 | 10,000 | 5,750 |
| **Total** | | | **56,185** | **56,185** | **2,685** | **50,000** | **6,185** |

**Allocation Logic:**
1. Pay oldest invoice first (FIFO by due date)
2. INV-001 fully paid: 21,000 AED
3. INV-002 partially paid: 19,000 AED (435 AED remains)
4. INV-003 partially paid: 10,000 AED (5,750 AED remains)
5. Total allocated: 50,000 AED

**VAT Breakdown:**
- Total payment: 50,000 AED
- VAT portion: (21,000 × 1,000/21,000) + (19,000 × 935/19,435) + (10,000 × 750/15,750)
- VAT allocated: ~2,380 AED
- Principal allocated: ~47,620 AED

### Manual Allocation Override

**Use Case:** Customer specifies which invoices to pay.

**Process:**
1. Uncheck "Auto-allocate" (FIFO disabled)
2. Manually enter amount per invoice in "Allocated" column
3. System validates: Total allocated ≤ Payment amount
4. System recalculates balances

**Example:**
```
Payment: 50,000 AED
Customer request: "Pay INV-003 first, then INV-001"

Manual Allocation:
  INV-003: 15,750 AED (full)
  INV-001: 21,000 AED (full)
  INV-002: 13,250 AED (partial)
  Total: 50,000 AED ✅
```

---

## Part 3: Credit Limit Validation

### Credit Exposure Calculation

**Credit Exposure = Outstanding Invoices + Unbilled Orders - Advance Payments**

**Example:**
```
Customer: ABC Industries LLC
Credit Limit: 100,000 AED

Outstanding Invoices: 56,185 AED
Unbilled Orders (confirmed): 20,000 AED
Advance Payments (unused): -5,000 AED

Credit Exposure: 56,185 + 20,000 - 5,000 = 71,185 AED
Available Credit: 100,000 - 71,185 = 28,815 AED
```

### Real-Time Credit Check

**Payment Form Behavior:**
1. When customer selected, system fetches credit limit
2. Displays:
   - Credit Limit: 100,000 AED
   - Current Exposure: 71,185 AED
   - Available Credit: 28,815 AED (color-coded: green if >20%, red if <10%)
3. After payment allocation:
   - New Exposure: 71,185 - 50,000 = 21,185 AED
   - New Available Credit: 78,815 AED

**Color Coding:**
- **Green:** Available credit > 20% of limit (healthy)
- **Yellow:** Available credit 10-20% of limit (caution)
- **Red:** Available credit < 10% of limit (critical)
- **Blocked:** Exposure exceeds limit (no new orders allowed)

### Over-Limit Warning

**Scenario:** Customer credit limit exceeded.

**System Behavior:**
1. Payment recorded successfully (always allow payments)
2. Warning message: "Credit limit exceeded. Current exposure: 105,000 AED (limit: 100,000 AED)"
3. New orders blocked until exposure drops below limit

---

## Part 4: Payment Terms Validation

### Standard Payment Terms

| Term Code | Description | Due Days | Discount | Discount Days |
|-----------|-------------|----------|----------|---------------|
| NET30 | Net 30 days | 30 | 0% | 0 |
| NET60 | Net 60 days | 60 | 0% | 0 |
| NET90 | Net 90 days | 90 | 0% | 0 |
| 2/10-NET30 | 2% discount if paid within 10 days, else net 30 | 30 | 2% | 10 |
| COD | Cash on delivery | 0 | 0% | 0 |
| ADVANCE | Advance payment required | -30 | 0% | 0 |

### Terms Validation

**Customer Master Terms:** NET30 (pay within 30 days)

**Invoice Due Date Calculation:**
```
Invoice Date: 2024-03-15
Payment Terms: NET30
Due Date: 2024-04-14 (30 days from invoice date)
```

**Payment Form Validation:**
1. System displays customer's default payment terms
2. Validates payment against terms:
   - Early payment (before due date): ✅ Acceptable
   - On-time payment (on due date): ✅ Acceptable
   - Late payment (after due date): ⚠️ Warning + late fee calculation

**Late Payment Handling:**
```
Invoice: INV-001
Due Date: 2024-04-14
Payment Date: 2024-05-05 (21 days late)

Late Fee:
  Rate: 1% per month (company policy)
  Days late: 21 days
  Fee: (21,000 × 1% × 21/30) = 147 AED

Total Due: 21,000 + 147 = 21,147 AED
```

### Early Payment Discount

**Terms:** 2/10-NET30 (2% discount if paid within 10 days)

**Example:**
```
Invoice: INV-002
Invoice Date: 2024-03-10
Amount: 19,435 AED
Discount Terms: 2% if paid by 2024-03-20 (within 10 days)

Payment Date: 2024-03-18 (8 days, within discount period)
Discount Eligible: YES
Discount Amount: 19,435 × 2% = 388.70 AED
Amount Due: 19,435 - 389 = 19,046 AED

Payment Recorded: 19,046 AED
Invoice Status: PAID IN FULL (discount applied)
```

---

## Part 5: VAT Amount Breakdown

### VAT Tracking per Invoice

**Why Track VAT Separately?**
- Required for VAT return filing
- Separate VAT payable from revenue
- Track input VAT (claimable) vs. output VAT (collected)

**Payment Allocation with VAT:**
```
Invoice: INV-001
Total: 21,000 AED
VAT (5%): 1,000 AED
Principal: 20,000 AED

Payment Allocated: 21,000 AED

Breakdown:
  Principal Paid: 20,000 AED
  VAT Paid: 1,000 AED
```

### Partial Payment VAT Calculation

**Problem:** Invoice total 21,000 AED (20,000 principal + 1,000 VAT). Customer pays 10,500 AED (50%).

**VAT Allocation:**
```
Payment: 10,500 AED (50% of invoice)

Pro-rata VAT:
  VAT portion = 10,500 × (1,000 / 21,000) = 500 AED
  Principal portion = 10,500 - 500 = 10,000 AED

Accounting Entry:
  Bank: 10,500 AED Dr
  Accounts Receivable: 10,000 AED Cr (principal)
  VAT Payable: 500 AED Cr
```

### VAT Return Reporting

**Payment Form tracks:**
- VAT collected per payment
- VAT payment date (for cash basis accounting)
- Customer TRN (for audit trail)

**VAT Return Data:**
```
Period: March 2024

Payments Received:
  INV-001: 21,000 AED (VAT: 1,000 AED)
  INV-002: 19,435 AED (VAT: 935 AED)
  INV-003 (partial): 10,000 AED (VAT: 476 AED)

Total VAT Collected: 2,411 AED
Output VAT (Box 1 on VAT return): 2,411 AED
```

---

## Part 6: Bank Account Selection

### Payment Methods

| Method | Bank Account | Processing Time | Fees |
|--------|--------------|-----------------|------|
| **Cash** | Cash Counter | Instant | 0% |
| **Cheque** | Current Account | 2-3 days (clearing) | 0% |
| **Bank Transfer** | Current Account | Same day (UAE) | 20-50 AED |
| **Card Payment** | Merchant Account | Instant | 2-3% |
| **PDC (Post-Dated Cheque)** | Current Account | As per cheque date | 0% |

### Bank Account Routing

**Payment Form Fields:**
- **Payment Method:** Dropdown (Cash, Cheque, Transfer, Card, PDC)
- **Bank Account:** Auto-populated based on payment method
- **Reference Number:** Cheque number, transfer reference, card approval code

**Example:**
```
Payment Method: Bank Transfer
Bank Account: Emirates NBD - Current A/C (auto-selected)
Reference: TRF-2024-03-456789
Amount: 50,000 AED
Date: 2024-03-20
```

### Post-Dated Cheque (PDC) Handling

**Process:**
1. Customer gives PDC dated 2024-05-15
2. Payment recorded with:
   - Payment Method: PDC
   - Cheque Number: 123456
   - Cheque Date: 2024-05-15 (future)
   - Bank: Commercial Bank of Dubai
3. Status: **PENDING** (not yet cleared)
4. On 2024-05-15, deposit cheque
5. Status: **CLEARED** (after bank confirmation)

**Accounting:**
```
Receipt Date (2024-03-20):
  PDC Receivable: 50,000 AED Dr
  Accounts Receivable: 50,000 AED Cr

Clearance Date (2024-05-15):
  Bank: 50,000 AED Dr
  PDC Receivable: 50,000 AED Cr
```

---

## Part 7: Step-by-Step: Record a Payment

### Step 1: Open Payment Form

1. Navigate to **Payments → Add Payment**
2. Form loads with allocation table

### Step 2: Select Customer

1. Select customer from dropdown
2. System displays:
   - Credit limit and exposure
   - Payment terms
   - Outstanding invoices (allocation table)

### Step 3: Enter Payment Details

1. **Payment Date:** Select date
2. **Payment Method:** Cheque / Transfer / Cash / Card / PDC
3. **Bank Account:** Auto-selected based on method
4. **Reference Number:** Enter cheque no. / transfer ref.
5. **Amount Received:** Enter total payment amount

**Example:**
```
Customer: ABC Industries LLC
Payment Date: 2024-03-20
Payment Method: Bank Transfer
Bank Account: Emirates NBD Current A/C
Reference: TRF-2024-456789
Amount: 50,000 AED
```

### Step 4: Allocate to Invoices

**Option A: Auto-Allocate (FIFO)**
1. Click "Auto-Allocate"
2. System allocates oldest invoices first
3. Review allocation table

**Option B: Manual Allocation**
1. Uncheck "Auto-Allocate"
2. Enter amount per invoice in "Allocated" column
3. System validates total = payment amount

### Step 5: Verify VAT Breakdown

1. Review "VAT" column in allocation table
2. System calculates VAT portion per invoice
3. Total VAT displayed at bottom

### Step 6: Submit Payment

1. Click "Save Payment"
2. System validates:
   - Allocated amount ≤ Payment amount
   - Bank account selected
   - Reference number entered
3. Payment recorded
4. Invoice statuses updated (Paid / Partially Paid)
5. Credit exposure updated

**Confirmation:**
```
✅ Payment Recorded Successfully

Payment No.: PAY-2024-001
Amount: 50,000 AED
Allocated to 3 invoices
New Credit Exposure: 21,185 AED
Available Credit: 78,815 AED
```

---

## Part 8: Common Scenarios

### Scenario 1: Customer Pays Less Than Invoice

**Situation:** Invoice 21,000 AED, customer pays 15,000 AED.

**Steps:**
1. Enter payment: 15,000 AED
2. Allocate to INV-001 (partially)
3. System calculates:
   - Amount allocated: 15,000 AED
   - VAT paid: 15,000 × (1,000/21,000) = 714 AED
   - Principal paid: 14,286 AED
   - Outstanding: 6,000 AED

**Invoice Status:** Partially Paid (6,000 AED outstanding)

### Scenario 2: Customer Pays in Advance

**Situation:** Customer pays 30,000 AED before invoicing.

**Steps:**
1. Record payment as "Advance Payment"
2. No invoice allocation (allocation table empty)
3. Payment recorded as:
   - Customer Advance: 30,000 AED Cr
4. When invoice generated, allocate advance:
   - Invoice: 21,000 AED
   - Apply advance: 21,000 AED
   - Remaining advance: 9,000 AED (for future invoices)

### Scenario 3: Customer Overpays

**Situation:** Invoice 21,000 AED, customer pays 25,000 AED.

**Steps:**
1. Enter payment: 25,000 AED
2. Allocate to INV-001: 21,000 AED (full)
3. Excess: 4,000 AED
4. System prompts: "Excess payment. Apply as advance or refund?"
5. Select "Apply as Advance"
6. Excess 4,000 AED recorded as customer advance

---

## Part 9: Payment Reports

**Available Reports:**
- Payment Summary by Customer
- Payment Aging (0-30, 31-60, 61-90, 90+ days)
- Collection Efficiency Report
- VAT Collected Report (for VAT return)
- PDC Register (pending cheques)
- Late Payment Report (with penalties)

---

## Part 10: Business Rules

### Credit Limit Enforcement

| Exposure | Status | Action Allowed |
|----------|--------|----------------|
| < 80% of limit | Green | Normal operations |
| 80-100% of limit | Yellow | New orders require approval |
| > 100% of limit | Red | New orders blocked |
| Payment received | Any | Always allowed |

### Payment Terms Compliance

| Scenario | Action |
|----------|--------|
| Early payment | Apply discount (if applicable) |
| On-time payment | Normal processing |
| Late payment (1-30 days) | 1% late fee per month |
| Late payment (>30 days) | Account on hold, legal action |

### VAT Compliance

- All payments must track VAT separately
- VAT return filing: Cash basis (on payment date)
- Customer TRN required for audit trail

---

## Support

For payment recording issues:
- **Accounts Receivable Team:** Allocation, credit limits
- **Finance Manager:** Payment terms, late fees
- **IT Support:** System errors, bank integration

---

**End of Payment Recording Guide**
