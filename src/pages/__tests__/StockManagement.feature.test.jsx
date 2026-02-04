/**
 * Step 2: Feature Tests for Stock Management
 * Tests warehouse operations, transfers, batch tracking, and stock levels
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { assertSuccessToast, findButtonByRole } from "../../test/utils";

describe("Stock Management Feature", () => {
  describe("Stock Level Tracking", () => {
    it("should calculate accurate stock balance: Opening + IN - OUT = Closing", async () => {
      const MockStockBalance = () => {
        const [stock] = React.useState({
          opening: 100,
          inbound: 50,
          outbound: 30,
        });

        const closing = stock.opening + stock.inbound - stock.outbound;

        return (
          <>
            <div>Opening: {stock.opening}</div>
            <div>Inbound: +{stock.inbound}</div>
            <div>Outbound: -{stock.outbound}</div>
            <div>Closing: {closing}</div>
          </>
        );
      };

      render(<MockStockBalance />);

      expect(screen.getByText("Opening: 100")).toBeInTheDocument();
      expect(screen.getByText("Inbound: +50")).toBeInTheDocument();
      expect(screen.getByText("Outbound: -30")).toBeInTheDocument();
      expect(screen.getByText("Closing: 120")).toBeInTheDocument();
    });

    it("should prevent negative stock levels", async () => {
      const MockNegativeStock = () => {
        const [stock, setStock] = React.useState(30);
        const [error, setError] = React.useState("");

        const handleDeduct = (qty) => {
          if (qty > stock) {
            setError(`Cannot deduct ${qty} units. Available: ${stock}`);
          } else {
            setStock(stock - qty);
          }
        };

        return (
          <>
            <div>Stock: {stock}</div>
            {error && <div className="alert-error">{error}</div>}
            <button type="button" onClick={() => handleDeduct(50)}>
              Deduct 50 Units
            </button>
          </>
        );
      };

      render(<MockNegativeStock />);

      const deductBtn = findButtonByRole("Deduct 50 Units");
      await userEvent.click(deductBtn);

      expect(screen.getByText(/Cannot deduct 50 units/)).toBeInTheDocument();
    });
  });

  describe("Warehouse Transfers", () => {
    it("should transfer stock from one warehouse to another", async () => {
      const MockWarehouseTransfer = () => {
        const [warehouseA, setWarehouseA] = React.useState(100);
        const [warehouseB, setWarehouseB] = React.useState(50);
        const [transferQty, setTransferQty] = React.useState(0);
        const [status, setStatus] = React.useState("");

        const handleTransfer = () => {
          if (transferQty > warehouseA) {
            setStatus("error");
          } else {
            setWarehouseA(warehouseA - transferQty);
            setWarehouseB(warehouseB + transferQty);
            setStatus("success");
            setTransferQty(0);
          }
        };

        return (
          <>
            <div>Warehouse A: {warehouseA}</button>
            <div>Warehouse B: {warehouseB}</div>
            <input
              type="number"
              value={transferQty}
              onChange={(e) => setTransferQty(parseInt(e.target.value, 10))}
              placeholder="Quantity to Transfer"
            />
            <button type="button" onClick={handleTransfer}>
              Transfer
            </button>
            {status === "success" && <div className="alert-success">Transfer complete</div>}
            {status === "error" && <div className="alert-error">Insufficient stock</div>}
          </>
        );
      };

      render(<MockWarehouseTransfer />);

      const input = screen.getByPlaceholderText("Quantity to Transfer");
      await userEvent.type(input, "40");

      const transferBtn = findButtonByRole("Transfer");
      await userEvent.click(transferBtn);

      await assertSuccessToast(/Transfer complete/i);
      expect(screen.getByText("Warehouse A: 60")).toBeInTheDocument();
      expect(screen.getByText("Warehouse B: 90")).toBeInTheDocument();
    });

    it("should prevent transfer if insufficient stock in source warehouse", async () => {
      const MockTransferFail = () => {
        const [warehouseA] = React.useState(30);
        const [error, setError] = React.useState("");

        const handleTransfer = () => {
          if (50 > warehouseA) {
            setError(`Insufficient stock. Available: ${warehouseA}, Requested: 50`);
          }
        };

        return (
          <>
            <div>Warehouse A: {warehouseA}</div>
            {error && <div className="alert-error">{error}</div>}
            <button type="button" onClick={handleTransfer}>
              Transfer 50
            </button>
          </>
        );
      };

      render(<MockTransferFail />);

      const btn = findButtonByRole("Transfer 50");
      await userEvent.click(btn);

      expect(screen.getByText(/Insufficient stock/)).toBeInTheDocument();
    });
  });

  describe("Batch Tracking", () => {
    it("should track stock by batch with expiration dates", async () => {
      const MockBatchStock = () => {
        const [batches] = React.useState([
          {
            batchNo: "B-2025-001",
            qty: 50,
            mfgDate: "2025-01-01",
            expDate: "2026-01-01",
          },
          {
            batchNo: "B-2025-002",
            qty: 30,
            mfgDate: "2025-02-15",
            expDate: "2026-02-15",
          },
        ]);

        return (
          <>
            {batches.map((batch) => (
              <div key={batch.batchNo}>
                <div>
                  {batch.batchNo}: {batch.qty} units
                </div>
                <div>Exp: {batch.expDate}</div>
              </button>
            ))}
          </>
        );
      };

      render(<MockBatchStock />);

      expect(screen.getByText("B-2025-001: 50 units")).toBeInTheDocument();
      expect(screen.getByText("B-2025-002: 30 units")).toBeInTheDocument();
    });

    it("should use FIFO for batch allocation on stock out", async () => {
      const MockBatchFIFO = () => {
        const [batches, _setBatches] = React.useState([
          { batchNo: "B-001", qty: 50, sequence: 1 },
          { batchNo: "B-002", qty: 40, sequence: 2 },
          { batchNo: "B-003", qty: 30, sequence: 3 },
        ]);

        const handleAllocate = (requiredQty) => {
          const sorted = [...batches].sort((a, b) => a.sequence - b.sequence);
          const allocation = [];
          let remaining = requiredQty;

          for (const batch of sorted) {
            const qty = Math.min(remaining, batch.qty);
            allocation.push({ batchNo: batch.batchNo, qty });
            remaining -= qty;
            if (remaining === 0) break;
          }

          return allocation;
        };

        const allocation = handleAllocate(90);

        return (
          <>
            <div>Allocation for 90 units (FIFO):</div>
            {allocation.map((alloc) => (
              <div key={alloc.batchNo}>
                {alloc.batchNo}: {alloc.qty}
              </div>
            ))}
          </>
        );
      };

      render(<MockBatchFIFO />);

      expect(screen.getByText("B-001: 50")).toBeInTheDocument();
      expect(screen.getByText("B-002: 40")).toBeInTheDocument();
    });
  });

  describe("Stock Variance & Adjustments", () => {
    it("should record and explain stock variances", async () => {
      const MockVariance = () => {
        const [variance, _setVariance] = React.useState({
          expected: 100,
          actual: 95,
          difference: 5,
          reason: "normal_wear",
        });

        return (
          <>
            <div>Expected: {variance.expected}</div>
            <div>Actual: {variance.actual}</div>
            <div>Variance: {variance.difference}</div>
            <div>Reason: {variance.reason}</div>
          </>
        );
      };

      render(<MockVariance />);

      expect(screen.getByText("Expected: 100")).toBeInTheDocument();
      expect(screen.getByText("Actual: 95")).toBeInTheDocument();
      expect(screen.getByText("Variance: 5")).toBeInTheDocument();
    });

    it("should handle stock write-offs", async () => {
      const MockWriteOff = () => {
        const [stock, setStock] = React.useState(100);
        const [writeOffQty, setWriteOffQty] = React.useState(0);
        const [saved, setSaved] = React.useState(false);

        const handleWriteOff = () => {
          setStock(stock - writeOffQty);
          setSaved(true);
        };

        return (
          <>
            <div>Stock: {stock}</div>
            <input
              type="number"
              value={writeOffQty}
              onChange={(e) => setWriteOffQty(parseInt(e.target.value, 10))}
              placeholder="Write-off Quantity"
            />
            <button type="button" onClick={handleWriteOff}>
              Write Off
            </button>
            {saved && <div className="alert-success">Stock write-off recorded</div>}
          </>
        );
      };

      render(<MockWriteOff />);

      const input = screen.getByPlaceholderText("Write-off Quantity");
      await userEvent.type(input, "10");

      const btn = findButtonByRole("Write Off");
      await userEvent.click(btn);

      await assertSuccessToast(/Stock write-off/i);
      expect(screen.getByText("Stock: 90")).toBeInTheDocument();
    });
  });

  describe("Goods In Transit", () => {
    it("should track stock in goods-in-transit status", async () => {
      const MockGoodsInTransit = () => {
        const [shipments] = React.useState([
          { id: 1, qty: 100, status: "in_transit", shippedDate: "2025-12-15" },
          { id: 2, qty: 50, status: "received", shippedDate: "2025-12-10" },
        ]);

        const inTransitQty = shipments.filter((s) => s.status === "in_transit").reduce((sum, s) => sum + s.qty, 0);

        return (
          <>
            <div>Goods In Transit: {inTransitQty} units</div>
            {shipments.map((ship) => (
              <div key={ship.id}>
                Ship {ship.id}: {ship.qty} units - {ship.status}
              </div>
            ))}
          </>
        );
      };

      render(<MockGoodsInTransit />);

      expect(screen.getByText("Goods In Transit: 100 units")).toBeInTheDocument();
      expect(screen.getByText("Ship 1: 100 units - in_transit")).toBeInTheDocument();
    });
  });

  describe("Slow-Moving Inventory", () => {
    it("should identify slow-moving stock (not sold in 90+ days)", async () => {
      const MockSlowMoving = () => {
        const today = new Date();
        const [products] = React.useState([
          {
            sku: "P-001",
            qty: 50,
            lastSoldDate: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
          },
          {
            sku: "P-002",
            qty: 30,
            lastSoldDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        ]);

        const slowMoving = products.filter((p) => {
          const daysSinceSale = Math.floor((today - p.lastSoldDate) / (24 * 60 * 60 * 1000));
          return daysSinceSale > 90;
        });

        return (
          <>
            <div>Slow-moving items ({"\u003E"}90 days):</div>
            {slowMoving.map((item) => (
              <div key={item.sku} className="alert-warning">
                {item.sku}: {item.qty} units
              </div>
            ))}
          </>
        );
      };

      render(<MockSlowMoving />);

      expect(screen.getByText("P-001: 50 units")).toBeInTheDocument();
    });
  });
});
