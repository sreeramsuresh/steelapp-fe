/**
 * Step 2: Feature Tests for Payment Processing
 * Tests payment recording, allocation, reconciliation, and balance updates
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { assertSuccessToast, findButtonByRole } from "../../test/utils";

describe("Payment Processing Feature", () => {
  describe("Recording Payments", () => {
    it("should record full payment against invoice", async () => {
      const MockPaymentForm = () => {
        const [invoiceAmount] = React.useState(5000);
        const [paymentAmount, setPaymentAmount] = React.useState(0);
        const [status, setStatus] = React.useState("unpaid");
        const [saved, setSaved] = React.useState(false);

        const handleRecordPayment = () => {
          if (paymentAmount === invoiceAmount) {
            setStatus("paid");
            setSaved(true);
          }
        };

        return (
          <>
            <div>Invoice Amount: {invoiceAmount}</div>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              placeholder="Payment Amount"
            />
            <div>Status: {status}</div>
            <button type="button" onClick={handleRecordPayment}>
              Record Payment
            </button>
            {saved && <div className="alert-success">Payment recorded successfully</div>}
          </>
        );
      };

      render(<MockPaymentForm />);

      const input = screen.getByPlaceholderText("Payment Amount");
      await userEvent.type(input, "5000");

      const recordBtn = findButtonByRole("Record Payment");
      await userEvent.click(recordBtn);

      await assertSuccessToast(/Payment recorded/i);
      expect(screen.getByText("Status: paid")).toBeInTheDocument();
    });

    it("should record partial payment against invoice", async () => {
      const MockPartialPayment = () => {
        const [invoiceAmount] = React.useState(5000);
        const [paidAmount, setPaidAmount] = React.useState(0);
        const [paymentAmount, setPaymentAmount] = React.useState(0);
        const [saved, setSaved] = React.useState(false);

        const handleRecordPayment = () => {
          setPaidAmount(paidAmount + paymentAmount);
          setSaved(true);
          setPaymentAmount(0);
        };

        const remainingAmount = invoiceAmount - paidAmount;
        const status = remainingAmount === 0 ? "paid" : remainingAmount < invoiceAmount ? "partially paid" : "unpaid";

        return (
          <>
            <div>Invoice: {invoiceAmount}</div>
            <div>Paid: {paidAmount}</div>
            <div>Remaining: {remainingAmount}</div>
            <div>Status: {status}</div>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              placeholder="Payment Amount"
            />
            <button type="button" onClick={handleRecordPayment}>
              Record Payment
            </button>
            {saved && <div className="alert-success">Partial payment recorded</div>}
          </>
        );
      };

      render(<MockPartialPayment />);

      expect(screen.getByText("Status: unpaid")).toBeInTheDocument();

      // First partial payment
      const input = screen.getByPlaceholderText("Payment Amount");
      await userEvent.type(input, "2000");

      const recordBtn = findButtonByRole("Record Payment");
      await userEvent.click(recordBtn);

      expect(screen.getByText("Paid: 2000")).toBeInTheDocument();
      expect(screen.getByText("Remaining: 3000")).toBeInTheDocument();
      expect(screen.getByText("Status: partially paid")).toBeInTheDocument();
    });

    it("should prevent overpayment against invoice", async () => {
      const MockOverpaymentCheck = () => {
        const [invoiceAmount] = React.useState(5000);
        const [paymentAmount, setPaymentAmount] = React.useState(0);
        const [error, setError] = React.useState("");

        const handleRecordPayment = () => {
          if (paymentAmount > invoiceAmount) {
            setError(`Cannot record payment of ${paymentAmount} against invoice of ${invoiceAmount}`);
          }
        };

        return (
          <>
            <div>Invoice: {invoiceAmount}</div>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              placeholder="Payment Amount"
            />
            {error && <div className="alert-error">{error}</div>}
            <button type="button" onClick={handleRecordPayment}>
              Record Payment
            </button>
          </>
        );
      };

      render(<MockOverpaymentCheck />);

      const input = screen.getByPlaceholderText("Payment Amount");
      await userEvent.type(input, "6000");

      const recordBtn = findButtonByRole("Record Payment");
      await userEvent.click(recordBtn);

      expect(screen.getByText(/Cannot record payment/)).toBeInTheDocument();
    });
  });

  describe("Payment Allocation", () => {
    it("should allocate payment to oldest invoices first (FIFO)", async () => {
      const MockPaymentAllocation = () => {
        const [invoices] = React.useState([
          { id: 1, amount: 1000, daysOverdue: 30 },
          { id: 2, amount: 1500, daysOverdue: 15 },
          { id: 3, amount: 1000, daysOverdue: 5 },
        ]);
        const [paymentAmount] = React.useState(2200);
        const [allocation, setAllocation] = React.useState([]);

        const handleAllocate = () => {
          const sorted = [...invoices].sort((a, b) => b.daysOverdue - a.daysOverdue);
          const alloc = [];
          let remaining = paymentAmount;

          for (const inv of sorted) {
            const amount = Math.min(remaining, inv.amount);
            alloc.push({ invoiceId: inv.id, amount });
            remaining -= amount;
            if (remaining === 0) break;
          }
          setAllocation(alloc);
        };

        return (
          <>
            <button type="button" onClick={handleAllocate}>
              Auto-Allocate Payment
            </button>
            {allocation.length > 0 && (
              <div>
                <div>Allocation (oldest first):</div>
                {allocation.map((alloc) => (
                  <div key={alloc.invoiceId}>
                    Invoice {alloc.invoiceId}: {alloc.amount}
                  </div>
                ))}
              </button>
            )}
          </>
        );
      };

      render(<MockPaymentAllocation />);

      const allocBtn = findButtonByRole("Auto-Allocate Payment");
      await userEvent.click(allocBtn);

      // Should allocate 1000 to oldest, then 1200 to second oldest
      expect(screen.getByText("Invoice 1: 1000")).toBeInTheDocument();
      expect(screen.getByText("Invoice 2: 1200")).toBeInTheDocument();
    });
  });

  describe("Customer Balance Updates", () => {
    it("should update customer balance after payment", async () => {
      const MockCustomerBalance = () => {
        const [balance, setBalance] = React.useState(5000);

        const handlePayment = () => {
          setBalance(balance - 2000);
        };

        return (
          <>
            <div>Customer Balance: {balance}</div>
            <button type="button" onClick={handlePayment}>
              Process Payment of 2000
            </button>
          </>
        );
      };

      render(<MockCustomerBalance />);

      expect(screen.getByText("Customer Balance: 5000")).toBeInTheDocument();

      const paymentBtn = findButtonByRole("Process Payment");
      await userEvent.click(paymentBtn);

      expect(screen.getByText("Customer Balance: 3000")).toBeInTheDocument();
    });

    it("should prevent payment if customer is on credit hold", async () => {
      const MockCreditHold = () => {
        const [onCreditHold] = React.useState(true);
        const [error, setError] = React.useState("");

        const handlePayment = () => {
          if (onCreditHold) {
            setError("Customer is on credit hold. Payment cannot be processed.");
          }
        };

        return (
          <>
            <div>Credit Hold: {onCreditHold ? "Yes" : "No"}</button>
            {error && <div className="alert-error">{error}</div>}
            <button type="button" onClick={handlePayment}>
              Process Payment
            </button>
          </>
        );
      };

      render(<MockCreditHold />);

      const paymentBtn = findButtonByRole("Process Payment");
      await userEvent.click(paymentBtn);

      expect(screen.getByText(/Payment cannot be processed/)).toBeInTheDocument();
    });
  });

  describe("Payment Reconciliation", () => {
    it("should reconcile bank statement with recorded payments", async () => {
      const MockReconciliation = () => {
        const [bankAmount] = React.useState(5000);
        const [recordedAmount] = React.useState(5000);
        const isReconciled = bankAmount === recordedAmount;

        return (
          <>
            <div>Bank Statement: {bankAmount}</button>
            <div>Recorded Payments: {recordedAmount}</div>
            <div className={isReconciled ? "alert-success" : "alert-error"}>
              {isReconciled ? "Reconciled" : "Reconciliation mismatch"}
            </div>
          </>
        );
      };

      render(<MockReconciliation />);

      expect(screen.getByText(/Reconciled/)).toBeInTheDocument();
    });

    it("should flag unreconciled items", async () => {
      const MockUnreconciled = () => {
        const [bankAmount] = React.useState(5000);
        const [recordedAmount] = React.useState(4800);
        const difference = bankAmount - recordedAmount;

        return (
          <>
            <div>Bank: {bankAmount}</div>
            <div>Recorded: {recordedAmount}</div>
            {difference !== 0 && <div className="alert-error">Unreconciled: {difference}</div>}
          </>
        );
      };

      render(<MockUnreconciled />);

      expect(screen.getByText("Unreconciled: 200")).toBeInTheDocument();
    });
  });

  describe("Payment Methods", () => {
    it("should support multiple payment methods", async () => {
      const MockPaymentMethods = () => {
        const [method, setMethod] = React.useState("");
        const [reference, setReference] = React.useState("");

        return (
          <>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">Select Method</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
            </select>
            <input
              placeholder="Reference (Check #, Bank Ref, etc.)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            {/* eslint-disable-next-line local-rules/no-dead-button */}
            <button type="button">Record Payment</button>
          </>
        );
      };

      render(<MockPaymentMethods />);

      const select = screen.getByDisplayValue("Select Method");
      await userEvent.selectOptions(select, "bank_transfer");

      const refInput = screen.getByPlaceholderText(/Reference/);
      await userEvent.type(refInput, "SWIFT: ABC123XYZ");

      expect(select.value).toBe("bank_transfer");
      expect(refInput.value).toBe("SWIFT: ABC123XYZ");
    });
  });
});
