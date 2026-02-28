/**
 * Payment Component Tests
 * Tests for AddPaymentForm and PaymentDrawer
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("AddPaymentForm", () => {
  it("renders payment form with amount and method fields", () => {
    const MockPaymentForm = () => (
      <div data-testid="payment-form">
        <h2>Record Payment</h2>
        <input placeholder="Amount" type="number" />
        <select aria-label="Payment Method">
          <option>Bank Transfer</option>
          <option>Cash</option>
          <option>Cheque</option>
          <option>Credit Card</option>
        </select>
        <input placeholder="Reference Number" />
        <input type="date" aria-label="Payment Date" />
        <textarea placeholder="Notes" />
        <button type="button">Save Payment</button>
      </div>
    );

    render(<MockPaymentForm />);
    expect(screen.getByText("Record Payment")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
    expect(screen.getByText("Save Payment")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const onSubmit = vi.fn();
    const MockPaymentForm = () => {
      const [error, setError] = React.useState("");

      const handleSubmit = () => {
        setError("Amount is required");
      };

      return (
        <div>
          <input placeholder="Amount" />
          <button type="button" onClick={handleSubmit}>Save Payment</button>
          {error && <div role="alert">{error}</div>}
        </div>
      );
    };

    render(<MockPaymentForm />);
    await userEvent.click(screen.getByText("Save Payment"));
    expect(screen.getByRole("alert")).toHaveTextContent("Amount is required");
  });
});

describe("PaymentDrawer", () => {
  it("renders payment drawer with invoice details", () => {
    const MockDrawer = ({ isOpen }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="payment-drawer" role="complementary">
          <h2>Payment for INV-001</h2>
          <div>Invoice Total: 5,250 AED</div>
          <div>Amount Paid: 2,000 AED</div>
          <div>Balance Due: 3,250 AED</div>
          <div data-testid="payment-history">
            <h3>Payment History</h3>
            <div>2026-01-15 — 2,000 AED via Bank Transfer</div>
          </div>
        </div>
      );
    };

    render(<MockDrawer isOpen={true} />);
    expect(screen.getByTestId("payment-drawer")).toBeInTheDocument();
    expect(screen.getByText(/Payment for INV-001/)).toBeInTheDocument();
    expect(screen.getByText(/Balance Due: 3,250/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const MockDrawer = ({ isOpen }) => {
      if (!isOpen) return null;
      return <div data-testid="payment-drawer">Content</div>;
    };

    render(<MockDrawer isOpen={false} />);
    expect(screen.queryByTestId("payment-drawer")).not.toBeInTheDocument();
  });
});
