# Import/Export Documentation Guide

**Version:** 1.0
**Last Updated:** 2025-12-20
**Target Audience:** Import/Export Coordinators, Customs Clearance Team

---

## Overview

This guide covers the documentation requirements and compliance procedures for import and export transactions in the Ultimate Steel ERP system, ensuring full customs and VAT compliance.

---

## Part 1: Import Documentation (Epic 1, 12)

### Required Documents

#### 1. Bill of Entry (BOE)

**What it is:** Official customs document for import clearance.

**Required Fields:**

- BOE Number (format: BOE-YYYY-NNNNNN)
- BOE Date
- Port of Entry
- Customs Office Code
- Assessment Date

**Where to enter:** Import Order Form → Customs Section → BOE Details

**Validation:**

- BOE number must be unique
- Date cannot be future-dated
- Port of Entry must match container arrival port

**Example:**

```
BOE Number: BOE-2024-123456
BOE Date: 2024-03-15
Port: Jebel Ali Port
Customs Office: JAFZA
Assessment Date: 2024-03-16
```

#### 2. Certificate of Origin (COO)

**What it is:** Document certifying the country where goods were manufactured.

**Required Fields:**

- COO Number
- Issuing Country
- Issuing Authority
- Issue Date
- COO Type (Form A, Form E, Non-preferential)

**Where to enter:** Import Order Form → Documentation Section → COO Details

**Business Impact:**

- Determines duty rates (preferential vs. MFN)
- Required for VAT exemption on certain imports
- Critical for trade agreement benefits

**Example:**

```
COO Number: COO/IN/2024/789
Issuing Country: India
Issuing Authority: FIEO Mumbai
Issue Date: 2024-02-28
COO Type: Form A (GSP)
Duty Rate: 0% (preferential)
```

#### 3. HS Code Classification (Epic 1)

**What it is:** Harmonized System code (6-8 digits) classifying the product for customs.

**Required per line item:**

- HS Code (6-8 digits)
- HS Description
- Duty Rate (%)
- Statistical Code (optional)

**Where to enter:** Import Order Form → Line Items → HS Code column

**Common HS Codes for Stainless Steel:**

| Product Type     | HS Code    | Description             | Typical Duty |
| ---------------- | ---------- | ----------------------- | ------------ |
| SS Coils (304)   | 7219.32.00 | Cold-rolled coils, <3mm | 5%           |
| SS Sheets (316L) | 7219.35.00 | Hot-rolled sheets, ≥3mm | 5%           |
| SS Pipes         | 7306.40.00 | Stainless steel pipes   | 5%           |
| SS Fittings      | 7307.19.00 | Tube/pipe fittings      | 5%           |
| SS Bars          | 7222.11.00 | Hot-rolled bars         | 5%           |

**Validation:**

- HS code must be valid in UAE customs database
- Duty rate auto-populated based on HS code
- Mismatch between HS code and product triggers warning

#### 4. Import Procurement Details (Epic 12)

**Mill Certificate:**

- Mill name and location
- Heat number
- Material test certificate (MTC) reference
- Chemical composition
- Mechanical properties

**Quality Inspection:**

- Required? (Yes/No checkbox)
- Inspection Agency
- Inspection Location (Origin/Destination)
- Inspection Date
- Certificate Reference

**Letter of Credit (LC):**

- LC Number
- Issuing Bank
- LC Amount
- LC Expiry Date
- LC Type (Sight/Usance)

**Example:**

```
Mill: Jindal Stainless Ltd., Hisar, India
Heat Number: J304-2024-0123
MTC Reference: MTC/JSL/2024/456

Quality Inspection: Required
Agency: SGS India Pvt Ltd
Location: Mill (Origin)
Certificate: SGS-IN-2024-789

LC Number: LC/2024/001234
Issuing Bank: Emirates NBD
LC Amount: $250,000 USD
LC Expiry: 2024-06-30
LC Type: Usance 60 days
```

---

## Part 2: Export Documentation (Epic 13)

### Required Documents

#### 1. Tax Registration Number (TRN) Validation

**What it is:** UAE Tax Registration Number for VAT compliance.

**Required for:**

- All UAE customers (5% VAT)
- Designated Zone customers (0% VAT with valid TRN)
- Export customers (0% VAT, TRN optional)

**Validation Rules:**

- Format: 15 digits (e.g., 100123456789012)
- Must match customer master record
- System validates TRN against FTA database (if connected)

**Example:**

```
Customer: ABC Trading LLC
TRN: 100123456789012
Customer Type: UAE Mainland
VAT Rate: 5% (standard)

Customer: XYZ Free Zone Est.
TRN: 100987654321098
Customer Type: Designated Zone
VAT Rate: 0% (with COO)
```

#### 2. Certificate of Origin (COO) for Export

**When required:**

- Export to GCC countries
- Export to countries with trade agreements
- Re-export of foreign goods (need original COO)

**Process:**

1. System checks: Is COO required for destination country?
2. If YES: COO Required checkbox is auto-checked
3. User uploads COO document
4. System tracks COO number and issuing authority

**Example:**

```
Destination: Saudi Arabia
COO Required: YES (GCC member state)
COO Type: UAE Chamber of Commerce
COO Number: UAE/DXB/2024/12345
Issue Date: 2024-04-10
```

#### 3. HS Code Export Classification

**Required per line item:**

- Same HS code as original import (for re-export)
- UAE HS code (if value-added in UAE)

**Export-specific fields:**

- Country of Origin (COO field)
- Export Duty (usually 0% for UAE)
- Statistical Code for trade statistics

---

## Part 3: VAT Compliance (Epic 9)

### VAT Treatment Matrix

| Transaction Type    | Customer Location | VAT Rate       | Documentation        |
| ------------------- | ----------------- | -------------- | -------------------- |
| **Local Sale**      | UAE Mainland      | 5%             | TRN required         |
| **Local Sale**      | Designated Zone   | 0%             | TRN + COO required   |
| **Export Sale**     | Outside UAE       | 0%             | Export docs required |
| **Import Purchase** | Foreign Supplier  | Reverse Charge | BOE + COO required   |

### Reverse Charge Mechanism (Import)

**What it is:** UAE importer accounts for VAT on imported goods.

**System Behavior:**

1. Import order created with foreign supplier
2. System auto-applies "Reverse Charge" VAT treatment
3. VAT calculated at 5% on CIF value
4. VAT recorded as both Input VAT (claimable) and Output VAT (payable)

**Example:**

```
Import Order: INV-2024-001
Supplier: Indian Steel Ltd (Foreign)
CIF Value: 100,000 AED
Import VAT (5%): 5,000 AED

Accounting Entry:
  Input VAT (Recoverable): 5,000 AED Dr
  Output VAT (Reverse Charge): 5,000 AED Cr
  Net VAT Impact: 0 AED
```

### Designated Zone Transactions

**Requirements for 0% VAT:**

1. Customer has valid TRN
2. Customer is in designated zone (JAFZA, DMCC, etc.)
3. Certificate of Origin provided
4. Goods physically moved to zone

**System Validation:**

- If customer type = "Designated Zone" AND COO uploaded → 0% VAT
- If customer type = "Designated Zone" AND NO COO → 5% VAT (error warning)

---

## Part 4: Customs Clearance Checklist

### Import Clearance Steps

**Pre-Clearance (24-48 hours before arrival):**

- [ ] BOE drafted and submitted to customs
- [ ] COO uploaded to customs portal
- [ ] HS codes verified and confirmed
- [ ] Duty payment arranged
- [ ] Delivery order (DO) from shipping line

**Clearance (on arrival):**

- [ ] Container arrived at port
- [ ] Customs inspection (if required)
- [ ] BOE assessed and duty confirmed
- [ ] Duty + VAT paid
- [ ] Clearance certificate issued

**Post-Clearance:**

- [ ] Container released from port
- [ ] Transporter assigned
- [ ] Container delivered to warehouse
- [ ] Stock receipt created in ERP
- [ ] BOE and COO filed in system

### Export Clearance Steps

**Pre-Shipment:**

- [ ] Export invoice generated
- [ ] Packing list prepared
- [ ] COO obtained (if required)
- [ ] Export declaration submitted
- [ ] Shipping instructions to freight forwarder

**Clearance:**

- [ ] Customs inspection (if required)
- [ ] Export permit issued
- [ ] Container stuffing at warehouse/port
- [ ] Container sealed and loaded
- [ ] Bill of Lading (B/L) issued

**Post-Shipment:**

- [ ] B/L and documents couriered to customer
- [ ] Export declaration finalized
- [ ] VAT 0% rating documentation filed
- [ ] Payment follow-up with customer

---

## Part 5: Step-by-Step Workflows

### Workflow 1: Create Import Order with Full Compliance

**Step 1: Basic Order Details**

1. Navigate to **Import → Create Import Order**
2. Select **Supplier** (foreign supplier)
3. Enter **PO Number** and **PO Date**

**Step 2: Customs Documentation**

1. In **Customs Section**, enter:
   - BOE Number
   - BOE Date
   - Port of Entry
2. Upload **BOE PDF** (scan of official document)

**Step 3: Certificate of Origin**

1. In **Documentation Section**, enter:
   - COO Number
   - Issuing Country
   - Issuing Authority
   - Issue Date
2. Upload **COO PDF**

**Step 4: Line Items with HS Codes**

1. Add product line items
2. For each line, enter:
   - Product (unique_name from SSOT)
   - Quantity
   - Unit Price (FOB)
   - **HS Code** (6-8 digits)
3. System auto-populates duty rate

**Step 5: Landed Cost Allocation (Epic 6)**

1. Enter **Freight Charges** (shipping cost)
2. System calculates duty per line (HS code × CIF value)
3. Allocate freight and duty to each line item
4. System calculates **Landed Cost** = FOB + Freight + Duty

**Step 6: Procurement Details (Epic 12)**

1. In **Procurement Section**, enter:
   - Mill Name
   - Heat Number
   - Quality Inspection Required? (checkbox)
   - LC Number (if applicable)

**Step 7: Submit for Approval**

1. Click **Submit for Approval**
2. Customs coordinator reviews
3. Once approved, order status = **Approved**

**Step 8: Link to Stock Receipt**

1. When container arrives, create **Stock Receipt**
2. Select linked import order
3. System auto-fills BOE, COO, HS codes
4. GRN generated with batch association

### Workflow 2: Create Export Order with VAT Compliance

**Step 1: Customer Selection**

1. Navigate to **Export → Create Export Order**
2. Select **Customer**
3. System auto-fills:
   - Customer TRN (if UAE)
   - Customer Type (Mainland/Zone/Foreign)
   - Default VAT Rate

**Step 2: VAT Rate Validation**

1. Check auto-selected VAT rate:
   - UAE Mainland → 5%
   - Designated Zone (with COO) → 0%
   - Export → 0%
2. If Designated Zone and COO missing → System shows warning

**Step 3: Line Items**

1. Add product line items
2. For each line, enter:
   - Product (unique_name)
   - Quantity
   - Unit Price
   - **HS Code** (for export stats)
3. System calculates VAT per line

**Step 4: COO Requirement Check**

1. System checks destination country
2. If COO required, checkbox auto-enabled
3. Upload COO document

**Step 5: Shipment Type (Epic 7)**

1. Select shipment type:
   - **WAREHOUSE:** Stock deducted from warehouse
   - **DROP_SHIP:** Direct from supplier (no stock deduction)

**Step 6: Submit & Invoice**

1. Click **Create Invoice**
2. System generates VAT-compliant invoice
3. Invoice includes:
   - TRN (seller and buyer)
   - VAT rate and amount
   - HS codes per line
   - COO reference (if applicable)

---

## Part 6: Common Scenarios

### Scenario 1: Import with Preferential Duty

**Situation:** Importing from India with Form A COO (GSP).

**Steps:**

1. Enter COO Type: "Form A"
2. System applies 0% duty (preferential)
3. Landed cost = FOB + Freight (no duty)
4. VAT reverse charge still applies (5% on CIF)

**Result:** Significant cost savings vs. MFN duty.

### Scenario 2: Re-Export to Saudi Arabia

**Situation:** Customer in KSA orders product originally imported from India.

**Steps:**

1. Create export order for KSA customer
2. System checks: COO required for GCC export? YES
3. Upload original Indian COO
4. VAT rate = 0% (export)
5. Customs declaration references original import BOE

**Result:** Compliant export with proper documentation chain.

### Scenario 3: Designated Zone Sale

**Situation:** Sale to JAFZA customer.

**Steps:**

1. Customer type: "Designated Zone"
2. System sets VAT = 0% (conditional)
3. **Warning:** "COO required for 0% VAT"
4. Upload UAE COO (or re-export COO)
5. System validates: COO uploaded? YES → 0% VAT confirmed

**Result:** 0% VAT applied correctly, audit-compliant.

---

## Part 7: Compliance Tips

### DO:

✅ Always enter HS codes before submitting import orders
✅ Upload BOE and COO documents (scans) for every import
✅ Verify TRN for all UAE customers
✅ Check COO requirements for export destinations
✅ Use correct VAT rate based on customer location
✅ Document LC details for all LC-backed imports

### DON'T:

❌ Submit import order without BOE number
❌ Use generic HS codes (must be product-specific)
❌ Apply 0% VAT to designated zone without COO
❌ Export without checking COO requirement
❌ Mix up reverse charge (import) vs. 0% (export)

---

## Part 8: Troubleshooting

### Problem: "HS code invalid"

**Cause:** HS code not found in UAE customs database.

**Solution:**

1. Verify HS code format (6-8 digits)
2. Check latest UAE HS code list
3. Consult customs broker if unsure
4. Use nearest valid code and document reason

### Problem: "BOE number already exists"

**Cause:** BOE number used in another import order.

**Solution:**

1. Check if duplicate entry
2. If different container, BOE number must be unique per container
3. Verify BOE document for correct number

### Problem: "VAT rate mismatch"

**Cause:** System applied 5% VAT, but expected 0% for export.

**Solution:**

1. Check customer type (should be "Foreign" for export)
2. Verify destination country is outside UAE
3. If designated zone, ensure COO uploaded

---

## Part 9: Regulatory References

**UAE VAT Law:** Federal Decree-Law No. 8 of 2017
**Customs Law:** Federal Law No. 3 of 2009
**HS Codes:** UAE Customs Tariff 2024 Edition

**Useful Links:**

- Federal Tax Authority: https://tax.gov.ae
- UAE Customs: https://www.customs.gov.ae
- Dubai Customs: https://www.dubaicustoms.gov.ae

---

## Support

For import/export documentation issues:

- **Customs Clearance Team:** BOE, COO, clearance
- **VAT Compliance Team:** TRN, VAT rates
- **IT Support:** System errors, document uploads

---

**End of Import/Export Documentation Guide**
