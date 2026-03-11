# E2E Coverage Matrix

> Generated: 2026-03-10
> Source: `AppRouter.jsx` routes cross-referenced with `cypress/e2e/` spec files
> Total routes (unique paths): ~130 | Existing spec files: 73

## Coverage Level Definitions

| Level | Meaning |
|-------|---------|
| **none** | No E2E spec covers this route |
| **smoke** | Spec exists but only checks page load / element visibility (2-6 shallow tests) |
| **standard** | Spec covers core CRUD flows and primary happy paths |
| **deep** | Spec covers CRUD + edge cases, validation, error handling, cross-module interactions |

## Business Criticality Definitions

| Criticality | Decision Rule |
|-------------|---------------|
| **critical** | Financial (invoices, payments, receivables, payables, GL, VAT), Auth (login, permissions) |
| **high** | Sales docs (quotations, delivery notes, credit notes, POs, GRNs), Inventory (stock, warehouses) |
| **medium** | HR/Payroll, Expenses, Trade (import/export), Audit, Reports |
| **low** | Analytics dashboards, Settings, Marketing, Master data (countries, exchange rates) |

---

## Public Routes

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/` | Root redirect | `smoke.cy.js` | smoke | low | smoke |
| `/login` | Auth | `smoke.cy.js` | smoke | critical | deep |
| `/forgot-password` | Auth | -- | none | critical | standard |
| `/reset-password` | Auth | -- | none | critical | standard |
| `/accept-invite` | Auth | -- | none | critical | standard |
| `/marketing` | Marketing | -- | none | low | smoke |
| `/marketing/products` | Marketing | -- | none | low | smoke |
| `/marketing/about` | Marketing | -- | none | low | smoke |
| `/marketing/contact` | Marketing | -- | none | low | smoke |

---

## Core ERP Routes (`/app/*`)

### Home & Navigation

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app` (index) | Home | `homepage-integrity-summary.cy.js` | smoke | low | smoke |
| `/app/home` | Home | `homepage-integrity-summary.cy.js` | smoke | low | smoke |
| `/app/search` | Search | -- | none | low | smoke |

### Sales

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/quotations` | Quotations | `quotations-complete.cy.js` | smoke | high | deep |
| `/app/quotations/new` | Quotations | `quotations-complete.cy.js` | smoke | high | deep |
| `/app/quotations/:id` | Quotations | `quotations-complete.cy.js` | smoke | high | standard |
| `/app/quotations/:id/edit` | Quotations | `quotations-complete.cy.js` | smoke | high | standard |
| `/app/invoices` | Invoices | `invoice-workflows.cy.js` | smoke | critical | deep |
| `/app/invoices/new` | Invoices | `invoice-workflows.cy.js` | smoke | critical | deep |
| `/app/invoices/:id` | Invoices | `invoice-workflows.cy.js`, `invoice-stock-allocation.cy.js` | smoke | critical | deep |
| `/app/invoices/:invoiceId/confirm-allocation` | Invoices | `invoice-stock-allocation.cy.js` | smoke | critical | deep |
| `/app/delivery-notes` | Delivery Notes | `delivery-notes.cy.js` | smoke | high | standard |
| `/app/delivery-notes/new` | Delivery Notes | `delivery-notes.cy.js` | smoke | high | standard |
| `/app/delivery-notes/:id` | Delivery Notes | `delivery-notes.cy.js` | smoke | high | standard |
| `/app/delivery-notes/:id/edit` | Delivery Notes | `delivery-notes.cy.js` | smoke | high | standard |
| `/app/credit-notes` | Credit Notes | `credit-notes.cy.js` | smoke | critical | deep |
| `/app/credit-notes/new` | Credit Notes | `credit-notes.cy.js` | smoke | critical | standard |
| `/app/credit-notes/:id` | Credit Notes | `credit-notes.cy.js` | smoke | critical | standard |

### Purchases

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/purchases` | Purchases Dashboard | `procurement-cycle.cy.js` | smoke | high | standard |
| `/app/purchases/po/new` | PO Type Selection | `purchase-orders.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId` (workspace) | PO Workspace | `procurement-cycle.cy.js` | smoke | high | deep |
| `/app/purchases/po/:poId/overview` | PO Overview | `purchase-orders.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId/dispatch` | PO Dispatch | `procurement-cycle.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId/receive` | PO Receive/Return | `procurement-cycle.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId/grn` | PO GRN List | `grn.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId/grn/:grnId` | PO GRN Detail | `grn.cy.js` | smoke | high | standard |
| `/app/purchases/po/:poId/bills` | PO Bills List | `supplier-bills.cy.js` | smoke | critical | standard |
| `/app/purchases/po/:poId/bills/:billId` | PO Bill Detail | `supplier-bills.cy.js` | smoke | critical | standard |
| `/app/purchases/po/:poId/payments` | PO Payments List | `payments-financial.cy.js` | smoke | critical | standard |
| `/app/purchases/po/:poId/payments/:paymentId` | PO Payment Detail | `payments-financial.cy.js` | smoke | critical | standard |
| `/app/purchase-orders` | Redirect to /app/purchases | -- | none | high | smoke |
| `/app/purchase-orders/new` | PO Form (legacy) | `purchase-orders.cy.js` | smoke | high | standard |
| `/app/purchase-orders/:id/edit` | PO Edit (legacy) | `purchase-orders.cy.js` | smoke | high | standard |
| `/app/supplier-bills` | Supplier Bills | `supplier-bills.cy.js` | smoke | critical | deep |
| `/app/supplier-bills/new` | Supplier Bills | `supplier-bills.cy.js` | smoke | critical | standard |
| `/app/supplier-bills/:id` | Supplier Bills | `supplier-bills.cy.js` | smoke | critical | standard |
| `/app/supplier-bills/:id/edit` | Supplier Bills | `supplier-bills.cy.js` | smoke | critical | standard |
| `/app/debit-notes` | Debit Notes | `debit-notes.cy.js` | smoke | critical | standard |
| `/app/debit-notes/new` | Debit Notes | `debit-notes.cy.js` | smoke | critical | standard |
| `/app/debit-notes/:id` | Debit Notes | `debit-notes.cy.js` | smoke | critical | standard |
| `/app/debit-notes/:id/edit` | Debit Notes | `debit-notes.cy.js` | smoke | critical | standard |
| `/app/advance-payments` | Advance Payments | `advance-payments.cy.js` | smoke | critical | standard |
| `/app/advance-payments/new` | Advance Payments | `advance-payments.cy.js` | smoke | critical | standard |
| `/app/advance-payments/:id` | Advance Payments | `advance-payments.cy.js` | smoke | critical | standard |

### Finance (Operational)

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/finance` | Finance Dashboard | -- | none | critical | standard |
| `/app/finance/document-workflow` | Document Workflow Guide | -- | none | low | smoke |
| `/app/receivables` | Receivables | `receivables.cy.js` | smoke | critical | deep |
| `/app/payables` | Payables | `payables.cy.js` | smoke | critical | deep |
| `/app/operating-expenses` | Operating Expenses | `operating-expenses.cy.js` | smoke | critical | standard |
| `/app/account-statements` | Account Statements | `account-statements.cy.js` | smoke | critical | standard |
| `/app/account-statements/new` | Account Statements | `account-statements.cy.js` | smoke | critical | standard |
| `/app/account-statements/:id` | Account Statements | `account-statements.cy.js` | smoke | critical | standard |
| `/app/customer-perspective/:customerId` | Customer Perspective | `customer-credit-mgmt.cy.js` | smoke | high | standard |

### Commissions

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/my-commissions` | Agent Commission | `commissions.cy.js` | smoke | high | standard |
| `/app/commission-dashboard` | Commission Dashboard | `commissions.cy.js` | smoke | high | standard |

### HR, Payroll & Expenses

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/employees-hub` | Employees Hub | -- | none | medium | smoke |
| `/app/cost-centers-hub` | Cost Centers Hub | -- | none | medium | smoke |
| `/app/payroll-hub` | Payroll Hub | -- | none | medium | smoke |
| `/app/employee-finance` | Employee Finance Hub | -- | none | medium | smoke |
| `/app/expenses-hub` | Expenses Hub | -- | none | medium | smoke |
| `/app/expense-config` | Expense Config Hub | -- | none | medium | smoke |
| `/app/departments` | Departments | -- | none | medium | smoke |
| `/app/cost-centers` | Cost Centers | -- | none | medium | smoke |
| `/app/designations` | Designations | -- | none | medium | smoke |
| `/app/employees` | Employee List | -- | none | medium | standard |
| `/app/employees/new` | Employee Form | -- | none | medium | standard |
| `/app/employees/:id/edit` | Employee Edit | -- | none | medium | standard |
| `/app/expense-categories` | Expense Categories | -- | none | medium | smoke |
| `/app/expense-approval-chains` | Expense Approval | -- | none | medium | standard |
| `/app/expense-policies` | Expense Policies | `categories-policies.cy.js` | smoke | medium | standard |
| `/app/recurring-expenses` | Recurring Expenses | -- | none | medium | standard |
| `/app/salary-components` | Salary Components | -- | none | medium | smoke |
| `/app/salary-structures` | Salary Structures | -- | none | medium | standard |
| `/app/salary-structures/new` | Salary Structure Form | -- | none | medium | standard |
| `/app/salary-structures/:id` | Salary Structure Detail | -- | none | medium | standard |
| `/app/payroll-runs` | Payroll Runs | -- | none | medium | deep |
| `/app/payroll-runs/:id` | Payroll Run Detail | -- | none | medium | standard |
| `/app/payroll-runs/:id/payslip/:entryId` | Payslip View | -- | none | medium | standard |
| `/app/employee-advances` | Employee Advances | -- | none | medium | standard |
| `/app/employee-advances/new` | Employee Advance Form | -- | none | medium | standard |
| `/app/employee-loans` | Employee Loans | -- | none | medium | standard |
| `/app/payroll-register` | Payroll Register | -- | none | medium | smoke |
| `/app/cost-center-budgets` | Cost Center Budgets | -- | none | medium | standard |

### Inventory

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/warehouses` | Warehouse List | `warehouse-management.cy.js`, `multi-warehouse-operations.cy.js` | smoke | high | standard |
| `/app/warehouses/:id` | Warehouse Detail | `warehouse-management.cy.js` | smoke | high | standard |
| `/app/inventory` | Stock Levels | `inventory-fulfillment-cycle.cy.js` | smoke | high | deep |
| `/app/stock-movements` | Stock Movements | `stock-movements.cy.js` | smoke | high | standard |

### Trade (Import/Export)

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/import-export` | Import/Export Dashboard | `import-orders.cy.js`, `export-orders.cy.js` | smoke | medium | standard |
| `/app/import-orders/new` | Import Order Form | `import-orders.cy.js` | smoke | medium | standard |
| `/app/import-orders/:id` | Import Order Details | `import-orders.cy.js` | smoke | medium | standard |
| `/app/import-orders/:id/edit` | Import Order Edit | `import-orders.cy.js` | smoke | medium | standard |
| `/app/export-orders/new` | Export Order Form | `export-orders.cy.js` | smoke | medium | standard |
| `/app/export-orders/:id` | Export Order Details | `export-orders.cy.js` | smoke | medium | standard |
| `/app/export-orders/:id/edit` | Export Order Edit | `export-orders.cy.js` | smoke | medium | standard |
| `/app/transit` | Transit List | -- | none | medium | smoke |
| `/app/containers` | Container List | `import-containers.cy.js` | smoke | medium | standard |
| `/app/containers/new` | Container Form | `import-containers.cy.js` | smoke | medium | standard |
| `/app/containers/:id` | Container Detail | `import-containers.cy.js` | smoke | medium | standard |
| `/app/containers/:id/edit` | Container Edit | `import-containers.cy.js` | smoke | medium | standard |

### Masters

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/customers` | Customer List | `customers.cy.js` | smoke | high | standard |
| `/app/customers/new` | Customer Form | `customers.cy.js` | smoke | high | standard |
| `/app/customers/:customerId/edit` | Customer Edit | `customers.cy.js` | smoke | high | standard |
| `/app/customers/:customerId` | Customer Detail | `customers.cy.js` | smoke | high | standard |
| `/app/customers/:customerId/pricing` | Customer Pricing | `customer-credit-mgmt.cy.js` | smoke | high | standard |
| `/app/products` | Products | `products.cy.js` | smoke | high | standard |
| `/app/pricelists` | Price Lists | `price-lists.cy.js` | smoke | high | standard |
| `/app/pricelists/new` | Price List Form | `price-lists.cy.js` | smoke | high | standard |
| `/app/pricelists/:id` | Price List Detail | `price-lists.cy.js` | smoke | high | standard |
| `/app/pricelists/:id/edit` | Price List Edit | `price-lists.cy.js` | smoke | high | standard |
| `/app/suppliers` | Supplier List | `supplier-management.cy.js` | smoke | high | standard |
| `/app/suppliers/new` | Supplier Form | `supplier-management.cy.js` | smoke | high | standard |
| `/app/suppliers/:id/edit` | Supplier Edit | `supplier-management.cy.js` | smoke | high | standard |
| `/app/supplier-quotations` | Supplier Quotation List | `supplier-quotations.cy.js` | smoke | high | standard |
| `/app/supplier-quotations/upload` | Supplier Quotation Upload | `supplier-quotations.cy.js` | smoke | high | standard |
| `/app/supplier-quotations/new` | Supplier Quotation Form | `supplier-quotations.cy.js` | smoke | high | standard |
| `/app/supplier-quotations/:id` | Supplier Quotation Detail | `supplier-quotations.cy.js` | smoke | high | standard |
| `/app/supplier-quotations/:id/edit` | Supplier Quotation Edit | `supplier-quotations.cy.js` | smoke | high | standard |
| `/app/countries` | Countries | `countries-currencies.cy.js` | smoke | low | smoke |
| `/app/exchange-rates` | Exchange Rates | `countries-currencies.cy.js` | smoke | low | smoke |
| `/app/base-prices` | Base Prices | -- | none | high | standard |

### Admin & Settings

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/settings` | Company Settings | `company-settings.cy.js` | smoke | low | standard |
| `/app/settings/financial` | Financial Settings | -- | none | critical | standard |
| `/app/settings/gl-mapping` | GL Mapping Rules | -- | none | critical | standard |
| `/app/users` | User Management | `user-management-create.cy.js`, `user-management-edit-permissions.cy.js` | smoke | critical | deep |
| `/app/roles` | Roles | `role-management.cy.js`, `rbac-advanced.cy.js` | smoke | critical | deep |
| `/app/permissions-matrix` | Permissions Matrix | `rbac-advanced.cy.js` | smoke | critical | standard |
| `/app/audit-logs` | Audit Logs | `audit-logs.cy.js` | smoke | medium | standard |
| `/app/feedback` | Feedback | `feedback.cy.js` | smoke | low | smoke |
| `/app/profile` | User Profile | -- | none | low | smoke |

### Audit Hub

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/app/audit-hub` | Audit Hub Dashboard | -- | none | medium | standard |
| `/app/audit-hub/datasets/:datasetId` | Dataset Explorer | -- | none | medium | standard |
| `/app/audit-hub/datasets/:periodId/:datasetId/sign-off` | Sign-Off Workflow | -- | none | medium | standard |

---

## Analytics Hub Routes (`/analytics/*`)

### Executive & Sales Analytics

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/analytics/dashboard` | Executive Dashboard | `dashboard-advanced.cy.js` | smoke | low | standard |
| `/analytics/profit-analysis` | Profit Analysis | `reports-generation.cy.js` | smoke | medium | standard |
| `/analytics/price-history` | Price History | `reports-generation.cy.js` | smoke | medium | smoke |
| `/analytics/commission-dashboard` | Commission Dashboard | `commissions.cy.js` | smoke | high | standard |
| `/analytics/ar-aging` | AR Aging | -- | none | critical | standard |

### Financial Reports

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/analytics/trial-balance` | Trial Balance | `reports-generation.cy.js` | smoke | critical | deep |
| `/analytics/cash-book` | Cash Book | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/journal-register` | Journal Register | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/bank-ledger` | Bank Ledger | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/bank-reconciliation` | Bank Reconciliation | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/cogs-analysis` | COGS Analysis | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/normalized-margin` | Normalized Margin | `reports-generation.cy.js` | smoke | critical | standard |
| `/analytics/reconciliation` | Reconciliation | -- | none | critical | standard |
| `/analytics/certificate-audit-trail` | Certificate Audit | `material-certificates.cy.js` | smoke | medium | smoke |

### VAT Reports

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/analytics/vat-return` | VAT Return | `vat-returns.cy.js` | smoke | critical | deep |
| `/analytics/vat-return/:id` | VAT Return Detail | `vat-returns.cy.js` | smoke | critical | standard |
| `/analytics/vat-return/:id/preview` | VAT Return Preview | `vat-returns.cy.js` | smoke | critical | standard |
| `/analytics/reports` | Reports Hub | `reports-generation.cy.js` | smoke | medium | smoke |

### Inventory & Purchase Analytics

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/analytics/batch-analytics` | Batch Analytics | `batch-aging-scenarios.cy.js` | smoke | high | standard |
| `/analytics/stock-movement-report` | Stock Movement Report | `stock-movements.cy.js` | smoke | high | standard |
| `/analytics/delivery-performance` | Delivery Variance | `delivery-variance.cy.js` | smoke | medium | smoke |
| `/analytics/supplier-performance` | Supplier Performance | -- | none | medium | smoke |
| `/analytics/audit-hub` | Audit Hub (Analytics) | -- | none | medium | standard |

### HR & Expense Analytics

| Route | Module | Current Spec Owner | Coverage Level | Business Criticality | Required Test Layer |
|-------|--------|--------------------|----------------|----------------------|---------------------|
| `/analytics/cost-center-pnl` | Cost Center P&L | -- | none | medium | standard |
| `/analytics/budget-vs-actual` | Budget vs Actual | -- | none | medium | standard |
| `/analytics/expense-trends` | Expense Trends | -- | none | medium | smoke |
| `/analytics/expense-reports` | Expense Reports | -- | none | medium | standard |
| `/analytics/payroll-register` | Payroll Register Report | -- | none | medium | smoke |
| `/analytics/salary-vs-revenue` | Salary vs Revenue | -- | none | medium | smoke |

---

## Cross-Cutting / Multi-Module Specs (No Single Route Owner)

These specs test workflows that span multiple routes:

| Spec File | Coverage Level | What It Covers |
|-----------|----------------|----------------|
| `smoke.cy.js` | smoke | Global page-load checks across key routes |
| `full-sales-cycle.cy.js` | smoke | Quotation-to-invoice-to-delivery flow |
| `procurement-cycle.cy.js` | smoke | PO-to-GRN-to-bill flow |
| `inventory-fulfillment-cycle.cy.js` | smoke | Stock allocation and fulfillment |
| `cross-module-integration.cy.js` | smoke | Cross-module data flow verification |
| `concurrent-user-workflows.cy.js` | smoke | Multi-user concurrency scenarios |
| `error-recovery-scenarios.cy.js` | smoke | Error handling across modules |
| `advanced-error-recovery.cy.js` | smoke | Advanced error/retry scenarios |
| `performance-smoke-tests.cy.js` | smoke | Page load performance baseline |
| `performance-load-testing.cy.js` | smoke | Load testing scenarios |
| `user-activity-logging.cy.js` | smoke | Audit trail for user actions |
| `pinned-products.cy.js` | smoke | Product pinning feature |
| `ops-management.cy.js` | smoke | Ops management workflows |
| `policy-snapshots-management.cy.js` | smoke | Policy snapshot CRUD |
| `templates-management.cy.js` | smoke | Template management |
| `integrations-management.cy.js` | smoke | Integrations settings |
| `notifications.cy.js` | smoke | Notification system |
| `unit-conversions.cy.js` | smoke | Unit conversion settings |
| `trn-verification.cy.js` | smoke | TRN verification flow |
| `vat-rates-config.cy.js` | smoke | VAT rate configuration |
| `vat-operations.cy.js` | smoke | VAT operational workflows |
| `batch-reservations.cy.js` | smoke | Stock batch reservation logic |
| `stock-batches.cy.js` | smoke | Stock batch CRUD |
| `customs-documents.cy.js` | smoke | Customs document management |
| `shipping-documents.cy.js` | smoke | Shipping document management |
| `trade-documentation.cy.js` | smoke | Trade document workflows |
| `trade-finance.cy.js` | smoke | Trade finance features |
| `export-shipping.cy.js` | smoke | Export shipping flow |
| `material-certificates.cy.js` | smoke | Material certificate tracking |

---

## Summary Statistics

### Coverage by Level

| Coverage Level | Route Count | Percentage |
|----------------|-------------|------------|
| **none** | 46 | 35% |
| **smoke** | 84 | 65% |
| **standard** | 0 | 0% |
| **deep** | 0 | 0% |

### Coverage Gaps by Business Criticality

| Criticality | Total Routes | With No Spec | With Smoke Only | Standard+ |
|-------------|-------------|-------------|-----------------|-----------|
| **critical** | 38 | 8 | 30 | 0 |
| **high** | 42 | 2 | 40 | 0 |
| **medium** | 38 | 28 | 10 | 0 |
| **low** | 12 | 8 | 4 | 0 |

### Priority Upgrade Targets (Critical Routes with No or Smoke Coverage)

**No spec at all (critical):**
1. `/forgot-password` -- Auth password recovery
2. `/reset-password` -- Auth password reset
3. `/accept-invite` -- Auth invitation acceptance
4. `/app/finance` -- Finance dashboard (entry point)
5. `/app/settings/financial` -- Financial settings (locked periods, fiscal year)
6. `/app/settings/gl-mapping` -- GL mapping rules
7. `/analytics/ar-aging` -- AR aging report
8. `/analytics/reconciliation` -- Financial reconciliation

**Smoke only, needs deep (critical):**
1. `/app/invoices` + `/app/invoices/new` -- Full invoice lifecycle
2. `/app/invoices/:invoiceId/confirm-allocation` -- Stock allocation confirmation
3. `/app/receivables` -- AR management
4. `/app/payables` -- AP management
5. `/app/credit-notes` -- Credit note lifecycle
6. `/app/users` + `/app/roles` -- RBAC system
7. `/analytics/trial-balance` -- Trial balance accuracy
8. `/analytics/vat-return` -- VAT return filing
9. `/app/supplier-bills` -- Supplier bill lifecycle
10. `/app/debit-notes` -- Debit note lifecycle

**Smoke only, needs standard+ (high):**
1. `/app/quotations` -- Quotation lifecycle
2. `/app/delivery-notes` -- Delivery note flow
3. `/app/purchases/po/:poId` -- PO workspace (nested routes)
4. `/app/inventory` -- Stock levels dashboard
5. `/app/warehouses` -- Warehouse management
6. `/app/customers` -- Customer CRUD + detail
7. `/app/products` -- Product management
8. `/app/pricelists` -- Price list management
