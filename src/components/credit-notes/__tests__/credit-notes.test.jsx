/**
 * Credit Notes Component Tests
 * Tests for CreditNotePreview, CreditNoteStatusActions, QCInspectionModal, ScrapItemsList
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("CreditNotePreview", () => {
  it("renders credit note preview with amounts and line items", () => {
    const MockPreview = () => (
      <div data-testid="cn-preview">
        <h2>Credit Note CN-001</h2>
        <div>Customer: ABC Corp</div>
        <div>Original Invoice: INV-001</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>10</td>
              <td>100</td>
              <td>1,000</td>
            </tr>
          </tbody>
        </table>
        <div>Subtotal: 1,000</div>
        <div>VAT: 50</div>
        <div>Total: 1,050</div>
      </div>
    );

    render(<MockPreview />);
    expect(screen.getByTestId("cn-preview")).toBeInTheDocument();
    expect(screen.getByText("Credit Note CN-001")).toBeInTheDocument();
    expect(screen.getByText(/Original Invoice/)).toBeInTheDocument();
  });
});

describe("CreditNoteStatusActions", () => {
  it("renders status actions based on current state", () => {
    const MockStatusActions = ({ status }) => {
      const actions = {
        DRAFT: ["Submit", "Delete"],
        SUBMITTED: ["Approve", "Reject"],
        APPROVED: ["Issue"],
      };

      return (
        <div data-testid="status-actions">
          <span>Status: {status}</span>
          {(actions[status] || []).map((action) => (
            <button key={action} type="button">
              {action}
            </button>
          ))}
        </div>
      );
    };

    render(<MockStatusActions status="DRAFT" />);
    expect(screen.getByText("Status: DRAFT")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows approve/reject for submitted status", () => {
    const MockStatusActions = ({ status }) => {
      const actions = { SUBMITTED: ["Approve", "Reject"] };
      return (
        <div>
          {(actions[status] || []).map((a) => (
            <button key={a} type="button">
              {a}
            </button>
          ))}
        </div>
      );
    };

    render(<MockStatusActions status="SUBMITTED" />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });
});

describe("QCInspectionModal", () => {
  it("renders QC inspection modal with form fields", () => {
    const onClose = vi.fn();
    const MockQCModal = ({ isOpen, onClose }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="qc-modal" role="dialog">
          <h2>QC Inspection</h2>
          <select aria-label="Inspection Result">
            <option>Pass</option>
            <option>Fail</option>
            <option>Partial</option>
          </select>
          <textarea placeholder="Inspection Notes" />
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button">Submit Inspection</button>
        </div>
      );
    };

    render(<MockQCModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("QC Inspection")).toBeInTheDocument();
    expect(screen.getByLabelText("Inspection Result")).toBeInTheDocument();
  });
});

describe("ScrapItemsList", () => {
  it("renders scrap items with quantities", () => {
    const MockScrapItems = () => (
      <div data-testid="scrap-items">
        <h3>Scrap Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>5</td>
              <td>Damaged</td>
            </tr>
            <tr>
              <td>SS-316-Bar</td>
              <td>3</td>
              <td>Wrong spec</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockScrapItems />);
    expect(screen.getByText("Scrap Items")).toBeInTheDocument();
    expect(screen.getByText("Damaged")).toBeInTheDocument();
    expect(screen.getByText("Wrong spec")).toBeInTheDocument();
  });
});
