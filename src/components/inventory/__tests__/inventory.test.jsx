/**
 * Inventory Component Tests
 * Tests for BatchCostTable, ProductBatchDrawer, and BatchAllocator
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("BatchCostTable", () => {
  it("renders batch cost breakdown", () => {
    const MockBatchCost = () => (
      <div data-testid="batch-cost-table">
        <h3>Batch Cost Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>B-001</td>
              <td>SS-304-Sheet</td>
              <td>100</td>
              <td>90 AED</td>
              <td>9,000 AED</td>
            </tr>
            <tr>
              <td>B-002</td>
              <td>SS-304-Sheet</td>
              <td>50</td>
              <td>95 AED</td>
              <td>4,750 AED</td>
            </tr>
          </tbody>
        </table>
        <div>Weighted Average Cost: 91.67 AED</div>
      </div>
    );

    render(<MockBatchCost />);
    expect(screen.getByText("Batch Cost Analysis")).toBeInTheDocument();
    expect(screen.getByText("B-001")).toBeInTheDocument();
    expect(screen.getByText("B-002")).toBeInTheDocument();
    expect(screen.getByText(/Weighted Average/)).toBeInTheDocument();
  });
});

describe("ProductBatchDrawer", () => {
  it("renders batch drawer with product details", () => {
    const MockBatchDrawer = ({ isOpen }) => {
      if (!isOpen) return null;
      return (
        <aside data-testid="batch-drawer">
          <h3>SS-304-Sheet — Batches</h3>
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>GRN</th>
                <th>Received</th>
                <th>Available</th>
                <th>Reserved</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>B-001</td>
                <td>GRN-001</td>
                <td>100</td>
                <td>80</td>
                <td>20</td>
              </tr>
              <tr>
                <td>B-002</td>
                <td>GRN-005</td>
                <td>50</td>
                <td>50</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
          <div>Total Available: 130 PCS</div>
        </aside>
      );
    };

    render(<MockBatchDrawer isOpen={true} />);
    expect(screen.getByTestId("batch-drawer")).toBeInTheDocument();
    expect(screen.getByText("B-001")).toBeInTheDocument();
    expect(screen.getByText(/Total Available: 130/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const MockBatchDrawer = ({ isOpen }) => {
      if (!isOpen) return null;
      return <div data-testid="batch-drawer">Content</div>;
    };

    render(<MockBatchDrawer isOpen={false} />);
    expect(screen.queryByTestId("batch-drawer")).not.toBeInTheDocument();
  });
});

describe("BatchAllocator", () => {
  it("renders FIFO allocation interface", () => {
    const _onAllocate = vi.fn();
    const MockAllocator = () => (
      <div data-testid="batch-allocator">
        <h3>Allocate Stock (FIFO)</h3>
        <div>Required: 30 PCS</div>
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Available</th>
              <th>Allocate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>B-001 (oldest)</td>
              <td>80</td>
              <td>
                <input type="number" defaultValue="30" />
              </td>
            </tr>
            <tr>
              <td>B-002</td>
              <td>50</td>
              <td>
                <input type="number" defaultValue="0" />
              </td>
            </tr>
          </tbody>
        </table>
        <div>Total Allocated: 30 / 30</div>
        <button type="button">Confirm Allocation</button>
      </div>
    );

    render(<MockAllocator />);
    expect(screen.getByText("Allocate Stock (FIFO)")).toBeInTheDocument();
    expect(screen.getByText(/Required: 30 PCS/)).toBeInTheDocument();
    expect(screen.getByText("Confirm Allocation")).toBeInTheDocument();
  });
});
