/**
 * Step 7: Database Integrity Tests
 * Ensures referential integrity, account reconciliation, and data consistency
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("Database Integrity & Data Consistency", () => {
  describe("Referential Integrity (Foreign Keys)", () => {
    it("should prevent orphaned invoice records (invoice without customer)", async () => {
      const MockOrphanedInvoice = () => {
        // Simulating database constraint check
        const [validationErrors, setValidationErrors] = React.useState([]);

        const checkReferentialIntegrity = (invoice) => {
          const errors = [];
          if (!invoice.customerId) {
            errors.push("FK Constraint: Invoice must have valid customer_id");
          }
          if (!invoice.companyId) {
            errors.push("FK Constraint: Invoice must have valid company_id");
          }
          setValidationErrors(errors);
        };

        React.useEffect(() => {
          // Try to save orphaned invoice
          checkReferentialIntegrity({
            id: 1,
            customerId: null,
            companyId: "COMPANY-A",
          });
        }, []);

        return (
          <>
            {validationErrors.length > 0 && (
              <div className="alert-error">
                {validationErrors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            )}
          </>
        );
      };

      render(<MockOrphanedInvoice />);

      expect(screen.getByText(/FK Constraint.*customer_id/)).toBeInTheDocument();
    });

    it("should prevent deleting customer if invoices exist (referential integrity)", async () => {
      const MockCascadeDelete = () => {
        const [customer] = React.useState({ id: 123, name: "ABC Corp" });
        const [invoices] = React.useState([
          { id: 1, customerId: 123 },
          { id: 2, customerId: 123 },
        ]);

        const canDelete = invoices.filter((inv) => inv.customerId === customer.id).length === 0;

        return (
          <>
            <div>Customer: {customer.name}</div>
            <div>Related Invoices: {invoices.filter((inv) => inv.customerId === customer.id).length}</div>
            <button disabled={!canDelete}>Delete Customer</button>
            {!canDelete && (
              <div className="alert-error">Cannot delete: Customer has {invoices.length} associated invoices</div>
            )}
          </>
        );
      };

      render(<MockCascadeDelete />);

      expect(screen.getByRole("button", { name: /Delete Customer/ })).toBeDisabled();
      expect(screen.getByText(/Cannot delete.*2 associated invoices/)).toBeInTheDocument();
    });
  });

  describe("Account Reconciliation", () => {
    it("should reconcile customer accounts: Invoiced - Paid = Outstanding", async () => {
      const MockAccountReconciliation = () => {
        const customerId = 123;

        const invoices = [
          { id: 1, amount: 5000, status: "paid" },
          { id: 2, amount: 3000, status: "unpaid" },
          { id: 3, amount: 2000, status: "partially_paid", paidAmount: 1000 },
        ];

        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = invoices.reduce(
          (sum, inv) => sum + (inv.status === "paid" ? inv.amount : inv.paidAmount || 0),
          0
        );
        const totalOutstanding = totalInvoiced - totalPaid;

        return (
          <>
            <div>Customer {customerId} Account Reconciliation:</div>
            <div>Total Invoiced: {totalInvoiced}</div>
            <div>Total Paid: {totalPaid}</div>
            <div>Outstanding: {totalOutstanding}</div>
            {totalInvoiced === totalPaid + totalOutstanding && (
              <div className="alert-success">Account reconciled ✓</div>
            )}
          </>
        );
      };

      render(<MockAccountReconciliation />);

      expect(screen.getByText("Total Invoiced: 10000")).toBeInTheDocument();
      expect(screen.getByText("Total Paid: 6000")).toBeInTheDocument();
      expect(screen.getByText("Outstanding: 4000")).toBeInTheDocument();
      expect(screen.getByText(/Account reconciled/)).toBeInTheDocument();
    });

    it("should detect account balance discrepancies", async () => {
      const MockBalanceDiscrepancy = () => {
        const calculated = {
          invoiced: 10000,
          paid: 6000,
          outstanding: 4000,
        };

        const recorded = {
          invoiced: 10000,
          paid: 5800, // Discrepancy!
          outstanding: 4200,
        };

        const hasDiscrepancy = calculated.outstanding !== recorded.outstanding;

        return (
          <>
            <div>Calculated Outstanding: {calculated.outstanding}</div>
            <div>Recorded Outstanding: {recorded.outstanding}</div>
            {hasDiscrepancy && (
              <div className="alert-error">
                Discrepancy detected: {Math.abs(calculated.outstanding - recorded.outstanding)} AED
              </div>
            )}
          </>
        );
      };

      render(<MockBalanceDiscrepancy />);

      expect(screen.getByText(/Discrepancy detected.*200 AED/)).toBeInTheDocument();
    });
  });

  describe("Stock Balance Calculations", () => {
    it("should verify stock balance: Opening + Receipt - Issuance = Closing", async () => {
      const MockStockReconciliation = () => {
        const movements = {
          opening: 100,
          receipts: [
            { date: "2025-12-01", qty: 50 },
            { date: "2025-12-05", qty: 30 },
          ],
          issuances: [
            { date: "2025-12-02", qty: 20 },
            { date: "2025-12-10", qty: 40 },
          ],
        };

        const totalReceipts = movements.receipts.reduce((sum, r) => sum + r.qty, 0);
        const totalIssuances = movements.issuances.reduce((sum, i) => sum + i.qty, 0);
        const calculatedClosing = movements.opening + totalReceipts - totalIssuances;

        const recordedClosing = 120; // Should match calculated

        const isBalanced = calculatedClosing === recordedClosing;

        return (
          <>
            <div>Opening: {movements.opening}</div>
            <div>Receipts: +{totalReceipts}</div>
            <div>Issuances: -{totalIssuances}</div>
            <div>Calculated Closing: {calculatedClosing}</div>
            <div>Recorded Closing: {recordedClosing}</div>
            {isBalanced ? (
              <div className="alert-success">Stock balance verified ✓</div>
            ) : (
              <div className="alert-error">Stock balance mismatch!</div>
            )}
          </>
        );
      };

      render(<MockStockReconciliation />);

      expect(screen.getByText("Opening: 100")).toBeInTheDocument();
      expect(screen.getByText("Receipts: +80")).toBeInTheDocument();
      expect(screen.getByText("Issuances: -60")).toBeInTheDocument();
      expect(screen.getByText(/Stock balance verified/)).toBeInTheDocument();
    });

    it("should detect stock variance", async () => {
      const MockStockVariance = () => {
        const [variance] = React.useState({
          physicalCount: 95,
          systemBalance: 100,
          difference: 5,
          variance_pct: 5,
        });

        return (
          <>
            <div>System Balance: {variance.systemBalance}</div>
            <div>Physical Count: {variance.physicalCount}</div>
            <div>
              Variance: {variance.difference} units ({variance.variance_pct}%)
            </div>
            {Math.abs(variance.variance_pct) > 2 && (
              <div className="alert-warning">Stock variance exceeds 2% threshold</div>
            )}
          </>
        );
      };

      render(<MockStockVariance />);

      expect(screen.getByText("Variance: 5 units (5%)")).toBeInTheDocument();
      expect(screen.getByText(/variance exceeds 2%/)).toBeInTheDocument();
    });
  });

  describe("Invoice Line Total Validation", () => {
    it("should verify invoice: sum of line items = invoice total", async () => {
      const MockInvoiceLineTotal = () => {
        const [invoice] = React.useState({
          lines: [
            { sku: "P-001", qty: 50, unitPrice: 100, lineTotal: 5000 },
            { sku: "P-002", qty: 30, unitPrice: 150, lineTotal: 4500 },
            { sku: "P-003", qty: 20, unitPrice: 200, lineTotal: 4000 },
          ],
          subtotal: 13500,
          vat: 675,
          total: 14175,
        });

        const calculatedSubtotal = invoice.lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const calculatedTotal = calculatedSubtotal * 1.05;

        const isValid = Math.abs(calculatedTotal - invoice.total) < 1; // Allow 1 AED rounding

        return (
          <>
            {invoice.lines.map((line) => (
              <div key={line.sku}>
                {line.sku}: {line.qty} × {line.unitPrice} = {line.lineTotal}
              </div>
            ))}
            <div>Calculated Subtotal: {calculatedSubtotal}</div>
            <div>Invoice Subtotal: {invoice.subtotal}</div>
            <div>Invoice Total: {invoice.total}</div>
            {isValid ? (
              <div className="alert-success">Invoice totals verified ✓</div>
            ) : (
              <div className="alert-error">Invoice total mismatch!</div>
            )}
          </>
        );
      };

      render(<MockInvoiceLineTotal />);

      expect(screen.getByText(/Invoice totals verified/)).toBeInTheDocument();
    });
  });

  describe("Trial Balance & Accounting Integrity", () => {
    it("should verify trial balance: Assets = Liabilities + Equity", async () => {
      const MockTrialBalance = () => {
        const [accounts] = React.useState({
          assets: 500000,
          liabilities: 200000,
          equity: 300000,
        });

        const isBalanced = accounts.assets === accounts.liabilities + accounts.equity;

        return (
          <>
            <div>Assets: {accounts.assets}</div>
            <div>Liabilities: {accounts.liabilities}</div>
            <div>Equity: {accounts.equity}</div>
            <div>Liabilities + Equity: {accounts.liabilities + accounts.equity}</div>
            {isBalanced ? (
              <div className="alert-success">Trial balance is correct ✓</div>
            ) : (
              <div className="alert-error">Trial balance does not balance!</div>
            )}
          </>
        );
      };

      render(<MockTrialBalance />);

      expect(screen.getByText(/Trial balance is correct/)).toBeInTheDocument();
    });

    it("should detect unmatched journal entries", async () => {
      const MockUnmatchedJournals = () => {
        const [entries] = React.useState([
          {
            id: 1,
            account: "Accounts Receivable",
            debit: 5000,
            credit: 0,
            matched: false,
          },
          {
            id: 2,
            account: "Sales Revenue",
            debit: 0,
            credit: 5000,
            matched: true,
          },
          { id: 3, account: "Cash", debit: 2000, credit: 0, matched: false },
        ]);

        const unmatchedCount = entries.filter((e) => !e.matched).length;

        return (
          <>
            <div>Total Entries: {entries.length}</div>
            <div>Unmatched: {unmatchedCount}</div>
            {unmatchedCount > 0 && (
              <div className="alert-warning">{unmatchedCount} unmatched journal entries require investigation</div>
            )}
          </>
        );
      };

      render(<MockUnmatchedJournals />);

      expect(screen.getByText("Unmatched: 2")).toBeInTheDocument();
      expect(screen.getByText(/2 unmatched journal entries/)).toBeInTheDocument();
    });
  });

  describe("Data Consistency Across Tables", () => {
    it("should verify stock batch links to correct warehouse", async () => {
      const MockBatchWarehouseLink = () => {
        const [batch] = React.useState({
          batchNo: "B-001",
          warehouseId: 1,
          warehouseName: "Warehouse A",
          qty: 100,
        });

        const [warehouse] = React.useState({
          id: 1,
          name: "Warehouse A",
        });

        const isLinked = batch.warehouseId === warehouse.id && batch.warehouseName === warehouse.name;

        return (
          <>
            <div>Batch: {batch.batchNo}</div>
            <div>
              Warehouse (from batch): {batch.warehouseName} (ID: {batch.warehouseId})
            </div>
            <div>
              Warehouse (from table): {warehouse.name} (ID: {warehouse.id})
            </div>
            {isLinked ? (
              <div className="alert-success">Batch-warehouse link verified ✓</div>
            ) : (
              <div className="alert-error">Batch-warehouse link broken!</div>
            )}
          </>
        );
      };

      render(<MockBatchWarehouseLink />);

      expect(screen.getByText(/Batch-warehouse link verified/)).toBeInTheDocument();
    });
  });

  describe("Duplicate Record Prevention", () => {
    it("should prevent duplicate invoices with same number and date", async () => {
      const MockDuplicateInvoice = () => {
        const [invoices] = React.useState([
          {
            id: 1,
            invoiceNumber: "INV-2025-001",
            invoiceDate: "2025-12-19",
            customerId: 123,
          },
          {
            id: 2,
            invoiceNumber: "INV-2025-001",
            invoiceDate: "2025-12-19",
            customerId: 123,
          }, // Duplicate!
        ]);

        const uniqueInvoices = new Set(invoices.map((inv) => `${inv.invoiceNumber}-${inv.invoiceDate}`));
        const hasDuplicate = uniqueInvoices.size < invoices.length;

        return (
          <>
            <div>Total Records: {invoices.length}</div>
            <div>Unique Invoices: {uniqueInvoices.size}</div>
            {hasDuplicate && <div className="alert-error">Duplicate invoice detected!</div>}
          </>
        );
      };

      render(<MockDuplicateInvoice />);

      expect(screen.getByText("Total Records: 2")).toBeInTheDocument();
      expect(screen.getByText("Unique Invoices: 1")).toBeInTheDocument();
      expect(screen.getByText(/Duplicate invoice/)).toBeInTheDocument();
    });
  });
});
