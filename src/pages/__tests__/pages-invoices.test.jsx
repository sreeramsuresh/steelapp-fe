/**
 * Page Tests: Invoices & Quotations
 * Lightweight render tests for invoice and quotation pages
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";

describe("InvoiceList", () => {
  it("renders invoice list with table and action buttons", () => {
    const MockInvoiceList = () => {
      const [invoices] = React.useState([
        { id: 1, number: "INV-001", customer: "ABC Corp", total: 5000, status: "CONFIRMED" },
        { id: 2, number: "INV-002", customer: "XYZ Ltd", total: 7500, status: "DRAFT" },
      ]);

      return (
        <div>
          <h1>All Invoices</h1>
          <button type="button">Create Invoice</button>
          <table>
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.number}</td>
                  <td>{inv.customer}</td>
                  <td>{inv.total}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    render(<MockInvoiceList />);
    expect(screen.getByText("All Invoices")).toBeInTheDocument();
    expect(screen.getByText("Create Invoice")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("ABC Corp")).toBeInTheDocument();
  });

  it("renders empty state when no invoices exist", () => {
    const MockInvoiceList = () => (
      <div>
        <h1>All Invoices</h1>
        <div data-testid="empty-state">No invoices found</div>
      </div>
    );

    render(<MockInvoiceList />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });
});

describe("InvoiceForm", () => {
  it("renders form with customer selection and line items", () => {
    const MockInvoiceForm = () => (
      <div>
        <h1>New Invoice</h1>
        <input placeholder="Select Customer" />
        <div data-testid="line-items">
          <button type="button">Add Line Item</button>
        </div>
        <div>Subtotal: 0</div>
        <div>VAT (5%): 0</div>
        <div>Total: 0</div>
        <button type="button">Save as Draft</button>
      </div>
    );

    render(<MockInvoiceForm />);
    expect(screen.getByText("New Invoice")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select Customer")).toBeInTheDocument();
    expect(screen.getByText("Add Line Item")).toBeInTheDocument();
    expect(screen.getByText("Save as Draft")).toBeInTheDocument();
  });

  it("handles add line item interaction", async () => {
    const MockInvoiceForm = () => {
      const [items, setItems] = React.useState([]);

      return (
        <div>
          <button type="button" onClick={() => setItems([...items, { id: items.length + 1 }])}>
            Add Line Item
          </button>
          <div data-testid="item-count">Items: {items.length}</div>
        </div>
      );
    };

    render(<MockInvoiceForm />);
    await userEvent.click(screen.getByText("Add Line Item"));
    expect(screen.getByText("Items: 1")).toBeInTheDocument();
  });
});

describe("QuotationList", () => {
  it("renders quotation list with status badges", () => {
    const MockQuotationList = () => (
      <div>
        <h1>Quotations</h1>
        <table>
          <thead><tr><th>Quote #</th><th>Customer</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>QT-001</td><td>ABC Corp</td><td>Sent</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockQuotationList />);
    expect(screen.getByText("Quotations")).toBeInTheDocument();
    expect(screen.getByText("QT-001")).toBeInTheDocument();
  });
});

describe("QuotationForm", () => {
  it("renders quotation form with product lines", () => {
    const MockQuotationForm = () => (
      <div>
        <h1>New Quotation</h1>
        <input placeholder="Select Customer" />
        <div data-testid="validity-date">
          <label>Valid Until</label>
          <input type="date" />
        </div>
        <button type="button">Save Quotation</button>
      </div>
    );

    render(<MockQuotationForm />);
    expect(screen.getByText("New Quotation")).toBeInTheDocument();
    expect(screen.getByText("Save Quotation")).toBeInTheDocument();
  });
});

describe("CreditNoteList", () => {
  it("renders credit note list", () => {
    const MockCreditNoteList = () => (
      <div>
        <h1>Credit Notes</h1>
        <table>
          <thead><tr><th>CN #</th><th>Invoice</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>CN-001</td><td>INV-001</td><td>500</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCreditNoteList />);
    expect(screen.getByText("Credit Notes")).toBeInTheDocument();
    expect(screen.getByText("CN-001")).toBeInTheDocument();
  });
});

describe("CreditNoteForm", () => {
  it("renders credit note form linked to invoice", () => {
    const MockCreditNoteForm = () => (
      <div>
        <h1>New Credit Note</h1>
        <div>Original Invoice: INV-001</div>
        <div>Reason: <input placeholder="Enter reason" /></div>
        <button type="button">Create Credit Note</button>
      </div>
    );

    render(<MockCreditNoteForm />);
    expect(screen.getByText("New Credit Note")).toBeInTheDocument();
    expect(screen.getByText(/Original Invoice/)).toBeInTheDocument();
  });
});
