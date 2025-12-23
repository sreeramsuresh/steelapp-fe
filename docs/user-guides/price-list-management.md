# Price List Management Guide

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Sales Team, Pricing Managers

---

## Overview

The Price List Management module enables you to create, manage, and approve product pricing with category-specific strategies, multi-currency support, and compliance controls.

---

## Key Features

### 1. Category-Based Pricing Strategy (Epic 8)

Different product categories require different pricing approaches:

| Category        | Pricing Unit         | Strategy                              |
| --------------- | -------------------- | ------------------------------------- |
| **COILS**       | Weight-based (MT/KG) | Cost + margin with minimum thresholds |
| **SHEETS**      | Weight-based (MT/KG) | Cost + margin with minimum thresholds |
| **PIPES_TUBES** | Length-based (MTR)   | Cost + margin + cutting charges       |
| **FITTINGS**    | Per piece (PCS)      | Fixed price per unit                  |
| **BARS_RODS**   | Length-based (MTR)   | Cost + margin + cutting charges       |

**Auto-Selection:** When you select a product category, the pricing unit is automatically set to the correct type.

### 2. Cost Validation & Margin Thresholds (Epic 2)

**Minimum Margin Requirements:**

- **LOCAL sales:** ≥ 5%
- **IMPORTED products:** ≥ 8%

**System Behavior:**

- If you enter a selling price below the minimum margin, you'll see a **warning message**
- The warning shows: "Margin below threshold for IMPORTED channel (minimum 8%)"
- You can proceed with a lower margin, but it will be **flagged for approval**

**Example:**

```
Product: 304 SS Coil 2mm
Cost Price: 10,000 AED/MT
Channel: IMPORTED
Minimum Margin: 8%

Selling Price (AED/MT):
- 10,500 AED → Margin: 5% → ⚠️ WARNING (below 8%)
- 10,800 AED → Margin: 8% → ✅ ACCEPTABLE
- 11,000 AED → Margin: 10% → ✅ GOOD
```

### 3. Effective Date Scheduling (Epic 14)

**Date Range Management:**

- Set **start date** (when price list becomes active)
- Set **end date** (when price list expires)
- System prevents overlapping date ranges for the same product

**Visual Timeline:**

- The form displays a timeline showing all price lists for the selected products
- Overlapping ranges are highlighted with a **red warning**

**Example:**

```
Product: 316L SS Sheet 3mm

Existing Price List:
  2024-01-01 to 2024-03-31 → 12,000 AED/MT

New Price List:
  2024-03-15 to 2024-06-30 → ⚠️ OVERLAP WARNING
  (Overlaps with existing by 16 days)

Corrected:
  2024-04-01 to 2024-06-30 → ✅ NO OVERLAP
```

### 4. Multi-Currency Margin Normalization (Epic 14)

**Problem:** Customers buy in different currencies (AED, USD, EUR), making margin comparison difficult.

**Solution:** The system normalizes all margins to AED equivalent using real-time exchange rates.

**Fields:**

- **Cost Currency:** Currency in which you purchased (USD, EUR, AED)
- **Selling Currency:** Currency in which customer pays
- **Exchange Rate:** Auto-fetched or manually entered
- **Normalized Margin (AED):** Calculated automatically

**Example:**

```
Product: 304 SS Coil
Cost Price: $2,500 USD/MT
Cost Currency: USD
Exchange Rate: 3.67 AED/USD
Cost (AED): 9,175 AED/MT

Selling Price: 10,500 AED/MT
Selling Currency: AED
Margin: 14.4%
Normalized Margin (AED): 14.4% ✅

Selling Price: $3,000 USD/MT (customer pays in USD)
Selling Currency: USD
Exchange Rate: 3.67 AED/USD
Selling (AED): 11,010 AED/MT
Margin: 20.0%
Normalized Margin (AED): 20.0% ✅
```

### 5. Approval Workflow (Epic 8)

**Status Flow:**

1. **Draft** → Created by sales rep, not yet submitted
2. **Pending Approval** → Submitted for manager review
3. **Approved** → Manager approved, now active and **read-only**
4. **Rejected** → Manager rejected, reason provided

**Approval Controls:**

- Only **approved** price lists can be used in export orders
- Once approved, price list becomes **read-only** (no edits allowed)
- Audit trail tracks: "Created by [User A] on [Date]" and "Approved by [Manager B] on [Date]"

**Manager Actions:**

- **Approve:** Click "Approve" button, add optional comment
- **Reject:** Click "Reject" button, provide rejection reason (required)

---

## Step-by-Step: Create a Price List

### Step 1: Select Product Category

1. Navigate to **Pricing → Create Price List**
2. Select product category from dropdown:
   - COILS
   - SHEETS
   - PIPES_TUBES
   - FITTINGS
   - BARS_RODS

**System auto-sets:** Pricing unit based on category

### Step 2: Enter Cost & Pricing

1. Enter **Cost Price** (your purchase cost)
2. Select **Cost Currency** (USD, AED, EUR)
3. Enter **Selling Price** (price to customer)
4. Select **Selling Currency**
5. System calculates:
   - Gross margin (%)
   - Normalized margin (AED equivalent)

**Validation:** If margin < threshold, you'll see a warning.

### Step 3: Set Effective Dates

1. Set **Start Date** (when price becomes active)
2. Set **End Date** (when price expires)
3. Check visual timeline for overlaps
4. Resolve any conflicts before proceeding

### Step 4: Submit for Approval

1. Click **Submit for Approval**
2. Status changes to **Pending Approval**
3. Manager is notified

**Created By:** Your name and timestamp are recorded.

### Step 5: Manager Approval (Manager Only)

1. Review submitted price list
2. Check:
   - Cost price is reasonable
   - Margin meets channel threshold
   - Effective dates are correct
   - No date overlaps
3. **Approve** or **Reject** with comment

**Approved By:** Manager name and timestamp are recorded.

---

## Common Use Cases

### Use Case 1: Seasonal Pricing

**Scenario:** Steel prices fluctuate quarterly. You need to schedule price changes in advance.

**Solution:**

1. Create Q1 price list (Jan 1 - Mar 31)
2. Create Q2 price list (Apr 1 - Jun 30)
3. Create Q3 price list (Jul 1 - Sep 30)
4. Submit all for approval
5. System automatically activates each price list on its start date

### Use Case 2: Multi-Currency Customer

**Scenario:** Customer wants quote in EUR, but you purchase in USD.

**Solution:**

1. Enter cost in USD (as purchased)
2. Enter selling price in EUR
3. System converts both to AED using exchange rates
4. Normalized margin (AED) ensures consistency

### Use Case 3: Emergency Price Change

**Scenario:** Supplier increased cost mid-month. Existing price list is no longer profitable.

**Solution:**

1. Create new price list with adjusted prices
2. Set start date = today
3. End current price list early (set end date = yesterday)
4. Submit new price list for urgent approval
5. Manager approves same day
6. New prices are effective immediately

---

## Business Rules

### Margin Thresholds

| Channel  | Minimum Margin | Enforcement      |
| -------- | -------------- | ---------------- |
| LOCAL    | 5%             | Warning if below |
| IMPORTED | 8%             | Warning if below |
| EXPORT   | 10%            | Warning if below |

### Date Overlaps

- **Same product, overlapping dates:** System blocks submission
- **Different products, overlapping dates:** Allowed
- **Same product, adjacent dates:** Allowed (no gap required)

### Approval Authority

| Role            | Can Create | Can Approve | Can Edit Approved |
| --------------- | ---------- | ----------- | ----------------- |
| Sales Rep       | ✅         | ❌          | ❌                |
| Sales Manager   | ✅         | ✅          | ❌                |
| Pricing Manager | ✅         | ✅          | ❌                |
| Admin           | ✅         | ✅          | ⚠️ Override only  |

### Currency Support

| Currency | Symbol | Auto-Fetch Rate?    |
| -------- | ------ | ------------------- |
| AED      | AED    | N/A (base currency) |
| USD      | $      | ✅ Yes              |
| EUR      | €      | ✅ Yes              |
| GBP      | £      | ✅ Yes              |
| SAR      | SAR    | ✅ Yes              |
| INR      | ₹      | ✅ Yes              |

---

## Troubleshooting

### Problem: "Margin below threshold" warning

**Cause:** Selling price is too low relative to cost.

**Solution:**

1. Increase selling price to meet minimum margin, OR
2. Proceed with warning and explain in approval comment

### Problem: "Date overlap detected"

**Cause:** Another price list exists for the same product in the same date range.

**Solution:**

1. Adjust start/end dates to avoid overlap, OR
2. End the existing price list early, OR
3. Wait for existing price list to expire

### Problem: "Cannot edit approved price list"

**Cause:** Approved price lists are read-only for audit compliance.

**Solution:**

1. Create a **new** price list with updated prices
2. Set start date to when new prices should apply
3. System will transition automatically

### Problem: "Exchange rate not available"

**Cause:** System couldn't fetch rate for selected currency pair.

**Solution:**

1. Enter exchange rate manually
2. Source from: Central Bank, xe.com, or company policy
3. Document source in comments

---

## Best Practices

1. **Schedule in advance:** Create price lists 1-2 weeks before effective date
2. **Review monthly:** Check for expiring price lists at month-end
3. **Document changes:** Use comment field to explain significant price changes
4. **Validate margins:** Always verify normalized margin (AED) for consistency
5. **Coordinate with procurement:** Ensure cost prices are current before creating price lists

---

## Audit & Compliance

**Tracked Information:**

- Created by (user, timestamp)
- Approved by (user, timestamp)
- Rejected by (user, timestamp, reason)
- All field changes (version history)

**Retention:** Price lists are retained indefinitely for audit purposes.

**Reports Available:**

- Price List History by Product
- Margin Analysis by Category
- Approval Timeline Report
- Multi-Currency Margin Comparison

---

## Support

For assistance with price list management:

- **Sales Manager:** Approval issues
- **Pricing Manager:** Margin thresholds, strategy questions
- **IT Support:** System errors, performance issues

**Training Resources:**

- Video: "Creating Your First Price List" (5 min)
- Video: "Multi-Currency Pricing Explained" (8 min)
- FAQ: Common Pricing Scenarios

---

**End of Price List Management Guide**
