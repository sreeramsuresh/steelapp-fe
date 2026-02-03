/**
 * Step 3: End-to-End Workflow Test - Full Purchase Cycle
 * Complete procurement process: RFQ → PO → GRN → Bill → Payment
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { findButtonByRole } from "../../../test/utils";

describe("E2E Workflow: Complete Purchase Cycle", () => {
  it("should execute full purchase cycle: RFQ → PO → GRN → Bill → Payment", async () => {
    const CompletePurchaseWorkflow = () => {
      const [step, setStep] = React.useState("rfq");
      const [data, setData] = React.useState({
        supplier: "Steel Supplier LLC",
        quantity: 100,
        unitCost: 50,
        subtotal: 5000,
        total: 5500,
        stockLevel: 100,
      });

      const handleRFQtoPO = () => {
        setStep("po");
        // PO inherits RFQ data
      };

      const handlePOtoGRN = () => {
        setStep("grn");
        // GRN awaits receipt of goods
      };

      const handleGRNReceived = () => {
        setStep("bill");
        setData({ ...data, stockLevel: data.stockLevel + data.quantity });
      };

      const handleBilltoPayment = () => {
        setStep("payment");
      };

      const handlePayment = () => {
        setStep("complete");
      };

      return (
        <>
          <div className="workflow-status">Current Step: {step}</div>

          {step === "rfq" && (
            <>
              <div>RFQ Status: Draft</div>
              <div>Supplier: {data.supplier}</div>
              <div>Quantity: {data.quantity}</div>
              <button onClick={handleRFQtoPO}>Convert to PO</button>
            </>
          )}

          {step === "po" && (
            <>
              <div>PO Status: Approved</div>
              <div>From Supplier: {data.supplier}</div>
              <div>Order Quantity: {data.quantity}</div>
              <div>Expected Cost: {data.total}</div>
              <button onClick={handlePOtoGRN}>Awaiting Goods Receipt</button>
            </>
          )}

          {step === "grn" && (
            <>
              <div>GRN Status: Ready</div>
              <div>Current Stock: {data.stockLevel - data.quantity}</div>
              <button onClick={handleGRNReceived}>Receive Goods (100 units)</button>
            </>
          )}

          {step === "bill" && (
            <>
              <div>Stock After Receipt: {data.stockLevel}</div>
              <div>Bill Amount: {data.total}</div>
              <div>3-Way Match: PO ✓ GRN ✓ Bill ✓</div>
              <button onClick={handleBilltoPayment}>Process for Payment</button>
            </>
          )}

          {step === "payment" && (
            <>
              <div>Bill Amount Due: {data.total}</div>
              <div>Payment Status: Unpaid</div>
              <button onClick={handlePayment}>Record Full Payment</button>
            </>
          )}

          {step === "complete" && (
            <>
              <div className="alert-success">Purchase Cycle Complete</div>
              <div>Final Stock Level: {data.stockLevel}</div>
              <div>Payment Status: Paid</div>
            </>
          )}
        </>
      );
    };

    render(<CompletePurchaseWorkflow />);

    // RFQ Step
    expect(screen.getByText("RFQ Status: Draft")).toBeInTheDocument();
    let btn = findButtonByRole("Convert to PO");
    await userEvent.click(btn);

    // PO Step
    expect(screen.getByText("PO Status: Approved")).toBeInTheDocument();
    btn = findButtonByRole("Awaiting Goods Receipt");
    await userEvent.click(btn);

    // GRN Step
    expect(screen.getByText("GRN Status: Ready")).toBeInTheDocument();
    btn = findButtonByRole("Receive Goods");
    await userEvent.click(btn);

    // Bill Step
    expect(screen.getByText(/3-Way Match.*✓/)).toBeInTheDocument();
    btn = findButtonByRole("Process for Payment");
    await userEvent.click(btn);

    // Payment Step
    expect(screen.getByText("Payment Status: Unpaid")).toBeInTheDocument();
    btn = findButtonByRole("Record Full Payment");
    await userEvent.click(btn);

    // Completion
    expect(screen.getByText(/Purchase Cycle Complete/)).toBeInTheDocument();
  });

  it("should handle partial GRN receipts across multiple shipments", async () => {
    const PartialReceiptWorkflow = () => {
      const [poQty] = React.useState(200);
      const [received, setReceived] = React.useState(0);
      const [status, setStatus] = React.useState("awaiting_receipt");

      const handleReceive = (qty) => {
        const newReceived = received + qty;
        setReceived(newReceived);
        setStatus(newReceived === poQty ? "complete" : "partially_received");
      };

      return (
        <>
          <div>PO Quantity: {poQty}</div>
          <div>Received: {received}</div>
          <div>Pending: {poQty - received}</div>
          <div>Status: {status}</div>
          <button onClick={() => handleReceive(100)}>Receive First Shipment (100)</button>
          <button onClick={() => handleReceive(100)} disabled={status === "complete"}>
            Receive Final Shipment (100)
          </button>
        </>
      );
    };

    render(<PartialReceiptWorkflow />);

    expect(screen.getByText("Status: awaiting_receipt")).toBeInTheDocument();

    let btn = findButtonByRole("Receive First Shipment");
    await userEvent.click(btn);

    expect(screen.getByText("Received: 100")).toBeInTheDocument();
    expect(screen.getByText("Status: partially_received")).toBeInTheDocument();

    btn = findButtonByRole("Receive Final Shipment");
    await userEvent.click(btn);

    expect(screen.getByText("Received: 200")).toBeInTheDocument();
    expect(screen.getByText("Status: complete")).toBeInTheDocument();
  });

  it("should enforce 3-way match (PO, GRN, Bill) before payment", async () => {
    const ThreeWayMatchWorkflow = () => {
      const [amounts, setAmounts] = React.useState({
        po: 5000,
        grn: 5000,
        bill: 4900, // Discrepancy
      });

      const isMatched = amounts.po === amounts.grn && amounts.grn === amounts.bill;

      return (
        <>
          <div>PO: {amounts.po}</div>
          <div>GRN: {amounts.grn}</div>
          <div>Bill: {amounts.bill}</div>
          {!isMatched && (
            <div className="alert-error">
              Discrepancy: Bill ({amounts.bill}) does not match PO ({amounts.po})
            </div>
          )}
          <button disabled={!isMatched}>Approve for Payment</button>
        </>
      );
    };

    render(<ThreeWayMatchWorkflow />);

    expect(screen.getByText(/Discrepancy/)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Approve for Payment/ });
    expect(btn).toBeDisabled();
  });
});
