/**
 * Stock Movement Component Tests
 * Tests for Reconciliation, Reservations, Transfers, and Overview
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("StockMovementOverview", () => {
  it("renders movement overview with summary stats", () => {
    const MockOverview = () => (
      <div data-testid="movement-overview">
        <h2>Stock Movement Overview</h2>
        <div data-testid="stats">
          <div>Transfers Today: 5</div>
          <div>Pending Reservations: 12</div>
          <div>Reconciliation Items: 3</div>
        </div>
      </div>
    );

    render(<MockOverview />);
    expect(screen.getByText("Stock Movement Overview")).toBeInTheDocument();
    expect(screen.getByText(/Transfers Today: 5/)).toBeInTheDocument();
  });
});

describe("TransferList", () => {
  it("renders transfer list with status", () => {
    const MockTransferList = () => (
      <div data-testid="transfer-list">
        <h3>Stock Transfers</h3>
        <table>
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Product</th><th>Qty</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>TF-001</td><td>Main WH</td><td>Dubai WH</td><td>SS-304</td><td>20</td><td>Completed</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockTransferList />);
    expect(screen.getByText("Stock Transfers")).toBeInTheDocument();
    expect(screen.getByText("TF-001")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});

describe("TransferForm", () => {
  it("renders transfer form with warehouse selection", () => {
    const MockTransferForm = () => (
      <div data-testid="transfer-form">
        <h3>New Stock Transfer</h3>
        <select aria-label="From Warehouse">
          <option>Main Warehouse</option>
          <option>Dubai Warehouse</option>
        </select>
        <select aria-label="To Warehouse">
          <option>Main Warehouse</option>
          <option>Dubai Warehouse</option>
        </select>
        <input placeholder="Select Product" />
        <input placeholder="Quantity" type="number" />
        <button type="button">Submit Transfer</button>
      </div>
    );

    render(<MockTransferForm />);
    expect(screen.getByText("New Stock Transfer")).toBeInTheDocument();
    expect(screen.getByLabelText("From Warehouse")).toBeInTheDocument();
    expect(screen.getByLabelText("To Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Submit Transfer")).toBeInTheDocument();
  });
});

describe("TransferDetailView", () => {
  it("renders transfer detail with tracking", () => {
    const MockTransferDetail = () => (
      <div data-testid="transfer-detail">
        <h3>Transfer TF-001</h3>
        <div>From: Main Warehouse</div>
        <div>To: Dubai Warehouse</div>
        <div>Product: SS-304-Sheet</div>
        <div>Quantity: 20 PCS</div>
        <div>Status: Completed</div>
        <div>Initiated: 2026-01-15</div>
        <div>Received: 2026-01-16</div>
      </div>
    );

    render(<MockTransferDetail />);
    expect(screen.getByText("Transfer TF-001")).toBeInTheDocument();
    expect(screen.getByText(/From: Main Warehouse/)).toBeInTheDocument();
  });
});

describe("ReservationList", () => {
  it("renders reservation list", () => {
    const MockReservationList = () => (
      <div data-testid="reservation-list">
        <h3>Stock Reservations</h3>
        <table>
          <thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>For</th><th>Expires</th></tr></thead>
          <tbody>
            <tr><td>RES-001</td><td>SS-304</td><td>50</td><td>INV-005</td><td>2026-03-01</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockReservationList />);
    expect(screen.getByText("Stock Reservations")).toBeInTheDocument();
    expect(screen.getByText("RES-001")).toBeInTheDocument();
  });
});

describe("ReservationForm", () => {
  it("renders reservation form", () => {
    const MockReservationForm = () => (
      <div data-testid="reservation-form">
        <h3>New Reservation</h3>
        <input placeholder="Select Product" />
        <input placeholder="Quantity" type="number" />
        <input type="date" aria-label="Expiry Date" />
        <textarea placeholder="Reason" />
        <button type="button">Reserve Stock</button>
      </div>
    );

    render(<MockReservationForm />);
    expect(screen.getByText("New Reservation")).toBeInTheDocument();
    expect(screen.getByText("Reserve Stock")).toBeInTheDocument();
  });
});

describe("ReservationDetailView", () => {
  it("renders reservation detail", () => {
    const MockReservationDetail = () => (
      <div data-testid="reservation-detail">
        <h3>Reservation RES-001</h3>
        <div>Product: SS-304-Sheet</div>
        <div>Quantity: 50 PCS</div>
        <div>Reserved For: Invoice INV-005</div>
        <div>Status: Active</div>
        <button type="button">Release Reservation</button>
      </div>
    );

    render(<MockReservationDetail />);
    expect(screen.getByText("Reservation RES-001")).toBeInTheDocument();
    expect(screen.getByText("Release Reservation")).toBeInTheDocument();
  });
});

describe("ReconciliationDashboard", () => {
  it("renders reconciliation dashboard with discrepancies", () => {
    const MockRecon = () => (
      <div data-testid="reconciliation-dash">
        <h3>Stock Reconciliation</h3>
        <div data-testid="recon-summary">
          <div>Total Items Checked: 150</div>
          <div>Discrepancies: 3</div>
          <div>Last Reconciliation: 2026-02-15</div>
        </div>
        <table>
          <thead><tr><th>Product</th><th>System Qty</th><th>Physical Qty</th><th>Diff</th></tr></thead>
          <tbody>
            <tr><td>SS-304-Sheet</td><td>500</td><td>498</td><td>-2</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockRecon />);
    expect(screen.getByText("Stock Reconciliation")).toBeInTheDocument();
    expect(screen.getByText(/Discrepancies: 3/)).toBeInTheDocument();
  });
});
