# Mock Data System - Documentation

## 📊 Overview

Complete mock data system for Ultimate Steel ERP frontend development and testing **without database dependency**.

**Total Records Generated: 772**
- Customers: 50
- Products: 100  
- Invoices: 200
- Payments: 126
- Quotations: 80
- Delivery Notes: 120
- Purchase Orders: 60
- Suppliers: 20
- Users: 10
- Price Lists: 5
- Company: 1

---

## 🚀 Quick Start

### Option 1: Enable Mock Mode (No Code Changes)

```bash
# Edit .env file
VITE_USE_MOCK_DATA=true

# Restart frontend
npm run dev
```

✅ **That's it!** The app now uses mock data.

### Option 2: Use Dedicated Mock Environment

```bash
# Copy .env.mock to .env.local
cp .env.mock .env.local

# Start app (automatically uses .env.local)
npm run dev
```

### Option 3: Toggle at Runtime (Future Enhancement)

Add toggle button in dev tools panel to switch between mock/real data without restart.

---

## 📁 Folder Structure

```
src/mock/
├── data/                      # Static JSON mock data files
│   ├── customers.json         # 50 customers
│   ├── products.json          # 100 products
│   ├── invoices.json          # 200 invoices
│   ├── payments.json          # 126 payments
│   ├── quotations.json        # 80 quotations
│   ├── deliveryNotes.json     # 120 delivery notes
│   ├── purchaseOrders.json    # 60 purchase orders
│   ├── suppliers.json         # 20 suppliers
│   ├── users.json             # 10 users
│   ├── priceLists.json        # 5 price lists
│   └── company.json           # 1 company
│
├── services/                  # Mock API service layer
│   └── mockInvoiceService.js  # Invoice CRUD + filtering
│
├── config/
│   └── mockConfig.js          # Configuration and feature flags
│
├── generateMockData.js        # Phase 1 generator (Customers, Products, Invoices)
├── generateAllMockData.js     # Phase 2 & 3 generator
└── README.md                  # This file
```

---

## 🎯 How It Works

### Architecture

```
Frontend Component
    ↓
import { invoiceService } from '../services/dataService'
    ↓
dataService checks VITE_USE_MOCK_DATA
    ↓
If TRUE  → mockInvoiceService.getInvoices() → Returns data from invoices.json
If FALSE → realInvoiceService.getInvoices() → Calls API Gateway (port 3000)
```

### No Code Changes Needed!

Components don't know if they're using mock or real data:

```javascript
// Component code (unchanged)
import { invoiceService } from '../services/dataService';

const invoices = await invoiceService.getInvoices({ page: 1, limit: 20 });
// ↑ Works with both mock and real API!
```

---

## 🔄 Switching Between Mock and Real Data

### Current Mode: Real API
```bash
# .env
VITE_USE_MOCK_DATA=false
```

### Switch to Mock Mode
```bash
# .env
VITE_USE_MOCK_DATA=true

# Restart frontend
npm run dev
```

### Switch Back to Real API
```bash
# .env
VITE_USE_MOCK_DATA=false

# Restart frontend
npm run dev
```

---

## ✨ Mock Invoice Service Features

### Supported Operations

1. **List Invoices** - `getInvoices(params)`
   - Pagination (page, limit)
   - Filtering (status, paymentStatus, customerId)
   - Search (invoiceNumber, customerName, notes)
   - Sorting (by field, asc/desc)
   - Date range (startDate, endDate)

2. **Get Invoice** - `getInvoice(id)`
   - Returns single invoice
   - Throws 404 if not found

3. **Create Invoice** - `createInvoice(data)`
   - Adds to in-memory array
   - Auto-generates ID

4. **Update Invoice** - `updateInvoice(id, data)`
   - Updates existing invoice
   - Throws 404 if not found

5. **Delete Invoice** - `deleteInvoice(id)`
   - Removes from array
   - Throws 404 if not found

6. **Add Payment** - `addPayment(invoiceId, paymentData)`
   - Adds payment to invoice
   - Auto-updates payment status

7. **Get Statistics** - `getInvoiceStats()`
   - Dashboard KPIs
   - Outstanding, overdue, due in 7 days
   - Total amounts

### Example Usage

```javascript
import { invoiceService } from '../services/dataService';

// List invoices with filters
const { data } = await invoiceService.getInvoices({
  page: 1,
  limit: 20,
  status: 'issued',
  paymentStatus: 'unpaid',
  search: 'Emirates',
  sortBy: 'invoiceDate',
  sortOrder: 'desc'
});

console.log(data.invoices);  // Array of invoices
console.log(data.total);     // Total count
console.log(data.totalPages); // Number of pages

// Get single invoice
const invoice = await invoiceService.getInvoice(5);

// Create invoice
const newInvoice = await invoiceService.createInvoice({
  customerId: 1,
  status: 'draft',
  items: [...]
});

// Update invoice
const updated = await invoiceService.updateInvoice(5, {
  status: 'issued'
});

// Add payment
const paid = await invoiceService.addPayment(5, {
  amount: 5000,
  method: 'bank_transfer',
  reference: 'TXN-123'
});

// Get stats for dashboard
const stats = await invoiceService.getInvoiceStats();
console.log(stats.outstanding); // AED amount
console.log(stats.overdue.count); // Number of overdue invoices
```

---

## 📊 Mock Data Distribution

### Customers (50)
- **Active:** 34 (68%)
- **Inactive:** 13 (26%)
- **Suspended:** 3 (6%)

**Categories:**
- Wholesalers: 40%
- Retailers: 30%
- Contractors: 20%
- Manufacturers: 10%

**Payment Terms:**
- NET_7: 30%
- NET_15: 40%
- NET_30: 20%
- NET_60: 10%

### Products (100)
**By Category:**
- Sheets: 37 (37%)
- Pipes: 31 (31%)
- Tubes: 21 (21%)
- Bars: 6 (6%)
- Coils: 5 (5%)

**By Grade:**
- SS 304: 35%
- SS 316: 30%
- SS 201: 15%
- SS 430: 10%
- Others: 10%

**Stock Status:**
- In Stock: 84 (84%)
- Low Stock: 16 (16%)
- Out of Stock: 0 (0%)

### Invoices (200)
**By Status:**
- Draft: 26 (13%)
- Proforma: 36 (18%)
- Sent: 39 (19.5%)
- Issued: 52 (26%)
- Overdue: 36 (18%)
- Cancelled: 11 (5.5%)

**By Payment Status:**
- Unpaid: 93 (46.5%)
- Partially Paid: 64 (32%)
- Fully Paid: 43 (21.5%)

**Date Distribution:**
- Last 30 days: ~60 (30%)
- Last 3 months: ~50 (25%)
- Last 6 months: ~50 (25%)
- Older: ~40 (20%)

**Amount Distribution:**
- Small (AED 5K-20K): 100 (50%)
- Medium (AED 20K-100K): 60 (30%)
- Large (AED 100K-500K): 30 (15%)
- Very Large (>500K): 10 (5%)

---

## 🧪 Testing Scenarios

### Scenario 1: Empty State
No invoices found (use filters that match nothing)

```javascript
const { data } = await invoiceService.getInvoices({
  status: 'cancelled',
  paymentStatus: 'fully_paid',
  search: 'NONEXISTENT'
});
// data.invoices = []
// Shows "No invoices found" message
```

### Scenario 2: Pagination
Test with different page sizes

```javascript
// Page 1
const page1 = await invoiceService.getInvoices({ page: 1, limit: 20 });

// Page 2
const page2 = await invoiceService.getInvoices({ page: 2, limit: 20 });

// Different page size
const large = await invoiceService.getInvoices({ page: 1, limit: 50 });
```

### Scenario 3: Filtering
Combine multiple filters

```javascript
const filtered = await invoiceService.getInvoices({
  status: 'issued',
  paymentStatus: 'unpaid',
  customerId: 5
});
```

### Scenario 4: Search
Search by invoice number or customer name

```javascript
const results = await invoiceService.getInvoices({
  search: 'Emirates'
});
```

### Scenario 5: Date Range
Filter by date range

```javascript
const recent = await invoiceService.getInvoices({
  startDate: '2024-11-01',
  endDate: '2024-11-18'
});
```

---

## 🔧 Regenerating Mock Data

### Regenerate All Data

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe

# Phase 1: Customers, Products, Invoices
node src/mock/generateMockData.js

# Phase 2 & 3: Everything else
node src/mock/generateAllMockData.js
```

### Customize Data Counts

Edit the generator scripts and change the count parameters:

```javascript
// src/mock/generateMockData.js
const customers = generateCustomers(100); // Change from 50 to 100
const products = generateProducts(200);   // Change from 100 to 200
const invoices = generateInvoices(500);   // Change from 200 to 500
```

---

## ⚠️ Important Notes

### Data Persistence

**Mock data changes are NOT persisted!**
- Changes live in browser memory only
- Refresh page = data resets to JSON files
- Create/Update/Delete operations work during session but are lost on reload

If you need persistent changes:
1. Use real API with database
2. OR modify JSON files directly
3. OR implement localStorage persistence

### Network Simulation

Mock services include 500ms delay by default to simulate network latency:

```javascript
// Adjust delay in mockConfig.js or .env
VITE_MOCK_DELAY=200  # Faster
VITE_MOCK_DELAY=2000 # Slower (test loading states)
```

### Production Safety

**Never enable mock data in production!**

```javascript
// .env.production
VITE_USE_MOCK_DATA=false  # MUST be false
```

---

## 🚀 Next Steps

### Add More Mock Services

Follow the pattern in `mockInvoiceService.js` to create:

1. **mockCustomerService.js**
2. **mockProductService.js**
3. **mockQuotationService.js**
4. **mockDeliveryNoteService.js**
5. **mockPurchaseOrderService.js**

Then add them to `dataService.js`:

```javascript
import * as mockCustomerService from '../mock/services/mockCustomerService';
export const customerService = USE_MOCK_DATA 
  ? mockCustomerService 
  : realCustomerService;
```

### Update Components

Change component imports from:

```javascript
import * as invoiceService from '../services/invoiceService';
```

To:

```javascript
import { invoiceService } from '../services/dataService';
```

---

## 📖 Resources

- **Mock Data Plan:** `/.claude/MOCK_DATA_PLAN.md`
- **Records Plan:** `/.claude/MOCK_DATA_RECORDS_PLAN.md`
- **Generator Scripts:** 
  - `/src/mock/generateMockData.js`
  - `/src/mock/generateAllMockData.js`

---

## ✅ Summary

**What You Have:**
- ✅ 772 realistic mock records
- ✅ Complete invoice service with filtering, pagination, search
- ✅ Easy toggle between mock/real data
- ✅ No code changes needed in components
- ✅ Network delay simulation
- ✅ UAE-specific data (addresses, TRN, phone numbers)

**What You Can Do:**
- ✅ Develop UI without database
- ✅ Test all UI scenarios
- ✅ Work offline
- ✅ Demo features without exposing real data
- ✅ Onboard new developers quickly

**Ready to use!** Just set `VITE_USE_MOCK_DATA=true` and restart the frontend.
