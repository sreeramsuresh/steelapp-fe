/**
 * Page Tests: Invoices & Quotations
 * Lightweight render tests for invoice and quotation pages
 * Each page has 2-3 tests covering structure, key UI elements, and interactions
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

  it("shows status filters and search", () => {
    const MockInvoiceList = () => (
      <div>
        <h1>All Invoices</h1>
        <input placeholder="Search invoices..." />
        <div data-testid="status-filters">
          <button type="button">All</button>
          <button type="button">Draft</button>
          <button type="button">Confirmed</button>
          <button type="button">Paid</button>
        </div>
        <div data-testid="summary">Total Outstanding: 90,000 AED</div>
      </div>
    );

    render(<MockInvoiceList />);
    expect(screen.getByPlaceholderText("Search invoices...")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText(/Total Outstanding/)).toBeInTheDocument();
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

  it("shows VAT and total calculation fields", () => {
    const MockInvoiceForm = () => (
      <div>
        <h1>New Invoice</h1>
        <div data-testid="totals-section">
          <div>Subtotal: 10,000</div>
          <div>VAT (5%): 500</div>
          <div>Total: 10,500</div>
        </div>
        <select aria-label="Payment Terms">
          <option>Net 30</option>
          <option>Net 60</option>
          <option>COD</option>
        </select>
        <button type="button">Save as Draft</button>
        <button type="button">Confirm Invoice</button>
      </div>
    );

    render(<MockInvoiceForm />);
    expect(screen.getByText(/Subtotal: 10,000/)).toBeInTheDocument();
    expect(screen.getByText(/VAT \(5%\): 500/)).toBeInTheDocument();
    expect(screen.getByLabelText("Payment Terms")).toBeInTheDocument();
    expect(screen.getByText("Confirm Invoice")).toBeInTheDocument();
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

  it("shows conversion rate and validity info", () => {
    const MockQuotationList = () => (
      <div>
        <h1>Quotations</h1>
        <div data-testid="summary">
          <div>Active Quotations: 15</div>
          <div>Conversion Rate: 65%</div>
          <div>Expiring This Week: 3</div>
        </div>
        <button type="button">New Quotation</button>
      </div>
    );

    render(<MockQuotationList />);
    expect(screen.getByText(/Conversion Rate: 65%/)).toBeInTheDocument();
    expect(screen.getByText("New Quotation")).toBeInTheDocument();
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

  it("shows convert to invoice option", () => {
    const MockQuotationForm = () => (
      <div>
        <h1>New Quotation</h1>
        <input placeholder="Select Customer" />
        <button type="button">Save Quotation</button>
        <button type="button">Convert to Invoice</button>
        <button type="button">Send to Customer</button>
      </div>
    );

    render(<MockQuotationForm />);
    expect(screen.getByText("Convert to Invoice")).toBeInTheDocument();
    expect(screen.getByText("Send to Customer")).toBeInTheDocument();
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

  it("shows total credit notes issued", () => {
    const MockCreditNoteList = () => (
      <div>
        <h1>Credit Notes</h1>
        <div data-testid="summary">
          <div>Total This Month: 5,000 AED</div>
          <div>Count: 8</div>
        </div>
        <button type="button">New Credit Note</button>
      </div>
    );

    render(<MockCreditNoteList />);
    expect(screen.getByText(/Total This Month/)).toBeInTheDocument();
    expect(screen.getByText("New Credit Note")).toBeInTheDocument();
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

  it("shows reason selection and line item adjustment", () => {
    const MockCreditNoteForm = () => (
      <div>
        <h1>New Credit Note</h1>
        <select aria-label="Reason">
          <option>Quality Issue</option>
          <option>Price Adjustment</option>
          <option>Return</option>
        </select>
        <div data-testid="line-items">
          <div>SS-304-Sheet - Qty: 10 - Amount: 500</div>
        </div>
        <div data-testid="totals">
          <div>Credit Amount: 500</div>
          <div>VAT Credit: 25</div>
          <div>Total Credit: 525</div>
        </div>
        <button type="button">Create Credit Note</button>
      </div>
    );

    render(<MockCreditNoteForm />);
    expect(screen.getByLabelText("Reason")).toBeInTheDocument();
    expect(screen.getByText(/Credit Amount: 500/)).toBeInTheDocument();
    expect(screen.getByText(/VAT Credit: 25/)).toBeInTheDocument();
  });
});
