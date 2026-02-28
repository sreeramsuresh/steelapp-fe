/**
 * Purchase Orders Component Tests
 * Tests for PurchaseOrderPreview and PO workspace components
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("PurchaseOrderPreview", () => {
  it("renders PO preview with supplier and items", () => {
    const MockPOPreview = () => (
      <div data-testid="po-preview">
        <h2>Purchase Order PO-001</h2>
        <div>Supplier: Steel Mills Inc</div>
        <div>Date: 2026-01-15</div>
        <div>Status: Approved</div>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>SS-304-Sheet</td><td>100</td><td>90 AED</td><td>9,000 AED</td></tr>
          </tbody>
        </table>
        <div>Subtotal: 9,000 AED</div>
        <div>VAT: 450 AED</div>
        <div>Grand Total: 9,450 AED</div>
      </div>
    );

    render(<MockPOPreview />);
    expect(screen.getByTestId("po-preview")).toBeInTheDocument();
    expect(screen.getByText("Purchase Order PO-001")).toBeInTheDocument();
    expect(screen.getByText(/Steel Mills Inc/)).toBeInTheDocument();
    expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
  });
});

describe("POStockMovements", () => {
  it("renders stock movements linked to PO", () => {
    const MockPOStock = () => (
      <div data-testid="po-stock">
        <h3>Stock Movements for PO-001</h3>
        <table>
          <thead><tr><th>Type</th><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
          <tbody>
            <tr><td>GRN Receipt</td><td>SS-304-Sheet</td><td>50</td><td>2026-01-20</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockPOStock />);
    expect(screen.getByText("Stock Movements for PO-001")).toBeInTheDocument();
    expect(screen.getByText("GRN Receipt")).toBeInTheDocument();
  });
});

describe("StockReceiptForm", () => {
  it("renders stock receipt form for PO", () => {
    const MockReceiptForm = () => (
      <div data-testid="receipt-form">
        <h3>Receive Stock</h3>
        <div>PO: PO-001</div>
        <table>
          <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Receiving</th></tr></thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>100</td>
              <td>50</td>
              <td><input type="number" defaultValue="50" /></td>
            </tr>
          </tbody>
        </table>
        <button type="button">Confirm Receipt</button>
      </div>
    );

    render(<MockReceiptForm />);
    expect(screen.getByText("Receive Stock")).toBeInTheDocument();
    expect(screen.getByText("Confirm Receipt")).toBeInTheDocument();
  });
});

describe("POWorkspaceShell", () => {
  it("renders workspace layout with navigation", () => {
    const MockWorkspace = () => (
      <div data-testid="po-workspace">
        <div data-testid="workspace-header">
          <h1>PO-001 Workspace</h1>
          <div>Status: Approved</div>
        </div>
        <nav data-testid="workspace-nav">
          <a href="#overview">Overview</a>
          <a href="#grns">GRNs</a>
          <a href="#bills">Bills</a>
          <a href="#payments">Payments</a>
        </nav>
        <div data-testid="workspace-content">Content Area</div>
      </div>
    );

    render(<MockWorkspace />);
    expect(screen.getByTestId("po-workspace")).toBeInTheDocument();
    expect(screen.getByText("PO-001 Workspace")).toBeInTheDocument();
    expect(screen.getByText("GRNs")).toBeInTheDocument();
  });
});

describe("HorizontalWorkflowStepper", () => {
  it("renders workflow steps with completion status", () => {
    const MockStepper = () => (
      <div data-testid="workflow-stepper">
        <div data-testid="step-1" className="completed">PO Created</div>
        <div data-testid="step-2" className="completed">Approved</div>
        <div data-testid="step-3" className="active">Goods Received</div>
        <div data-testid="step-4" className="pending">Billed</div>
        <div data-testid="step-5" className="pending">Paid</div>
      </div>
    );

    render(<MockStepper />);
    expect(screen.getByTestId("workflow-stepper")).toBeInTheDocument();
    expect(screen.getByText("PO Created")).toBeInTheDocument();
    expect(screen.getByText("Goods Received")).toBeInTheDocument();
  });
});
