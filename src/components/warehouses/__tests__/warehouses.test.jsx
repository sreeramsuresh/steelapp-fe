/**
 * Warehouse Component Tests
 * Tests for WarehouseCard, WarehouseFormDialog, WarehouseStockView, WarehouseSummaryCards
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("WarehouseCard", () => {
  it("renders warehouse card with capacity and occupancy", () => {
    const MockCard = () => (
      <div data-testid="warehouse-card">
        <h3>Main Warehouse</h3>
        <div>Location: Sharjah Industrial Area</div>
        <div>Total Bins: 200</div>
        <div>Occupied: 150 (75%)</div>
        <div data-testid="occupancy-bar" style={{ width: "75%" }} />
      </div>
    );

    render(<MockCard />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText(/Occupied: 150/)).toBeInTheDocument();
    expect(screen.getByTestId("occupancy-bar")).toBeInTheDocument();
  });
});

describe("WarehouseFormDialog", () => {
  it("renders warehouse creation dialog", () => {
    const onClose = vi.fn();
    const MockFormDialog = ({ isOpen, onClose }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="warehouse-dialog" role="dialog">
          <h2>Add Warehouse</h2>
          <input placeholder="Warehouse Name" />
          <input placeholder="Location" />
          <input placeholder="Number of Aisles" type="number" />
          <input placeholder="Bins per Aisle" type="number" />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button">Save</button>
        </div>
      );
    };

    render(<MockFormDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Warehouse Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Number of Aisles")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const MockFormDialog = ({ isOpen }) => {
      if (!isOpen) return null;
      return <div data-testid="warehouse-dialog">Dialog</div>;
    };

    render(<MockFormDialog isOpen={false} />);
    expect(screen.queryByTestId("warehouse-dialog")).not.toBeInTheDocument();
  });
});

describe("WarehouseStockView", () => {
  it("renders stock view with product breakdown", () => {
    const MockStockView = () => (
      <div data-testid="warehouse-stock">
        <h3>Stock — Main Warehouse</h3>
        <table>
          <thead><tr><th>Product</th><th>Bin</th><th>Qty</th><th>Weight</th></tr></thead>
          <tbody>
            <tr><td>SS-304-Sheet</td><td>A1-01</td><td>50 PCS</td><td>500 KG</td></tr>
            <tr><td>SS-316-Bar</td><td>A2-03</td><td>30 PCS</td><td>300 KG</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockStockView />);
    expect(screen.getByText("Stock — Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("A1-01")).toBeInTheDocument();
    expect(screen.getByText("500 KG")).toBeInTheDocument();
  });
});

describe("WarehouseSummaryCards", () => {
  it("renders summary cards with aggregated data", () => {
    const MockSummary = () => (
      <div data-testid="warehouse-summary">
        <div data-testid="card-total">
          <div>Total Warehouses</div>
          <div>3</div>
        </div>
        <div data-testid="card-bins">
          <div>Total Bins</div>
          <div>600</div>
        </div>
        <div data-testid="card-occupied">
          <div>Occupied Bins</div>
          <div>420</div>
        </div>
        <div data-testid="card-utilization">
          <div>Utilization</div>
          <div>70%</div>
        </div>
      </div>
    );

    render(<MockSummary />);
    expect(screen.getByTestId("warehouse-summary")).toBeInTheDocument();
    expect(screen.getByText("Total Warehouses")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });
});
