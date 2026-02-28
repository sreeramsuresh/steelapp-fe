import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import InvoiceFooterNotes from "../InvoiceFooterNotes";

describe("InvoiceFooterNotes", () => {
  it("renders terms when present", () => {
    render(<InvoiceFooterNotes invoice={{ terms: "Net 30 days" }} />);
    expect(screen.getByText("Terms & Conditions:")).toBeInTheDocument();
    expect(screen.getByText("Net 30 days")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(<InvoiceFooterNotes invoice={{ notes: "Handle with care" }} />);
    expect(screen.getByText("Handle with care")).toBeInTheDocument();
  });

  it("renders warehouse info", () => {
    render(
      <InvoiceFooterNotes
        invoice={{ warehouseName: "Main Warehouse", warehouseCode: "WH-01" }}
      />
    );
    expect(screen.getByText(/Main Warehouse/)).toBeInTheDocument();
    expect(screen.getByText(/WH-01/)).toBeInTheDocument();
  });

  it("renders tax notes when present", () => {
    render(<InvoiceFooterNotes invoice={{ taxNotes: "Zero-rated supply" }} />);
    expect(screen.getByText("Tax Notes:")).toBeInTheDocument();
    expect(screen.getByText("Zero-rated supply")).toBeInTheDocument();
  });

  it("renders payment history table", () => {
    const payments = [
      { date: "2025-01-01", method: "Bank", reference: "REF-1", amount: 500 },
    ];
    render(<InvoiceFooterNotes invoice={{ payments }} />);
    expect(screen.getByText("Payment History")).toBeInTheDocument();
    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("AED 500")).toBeInTheDocument();
  });

  it("renders nothing when invoice has no content", () => {
    const { container } = render(<InvoiceFooterNotes invoice={{}} />);
    expect(container.querySelector(".terms-section")).toBeNull();
  });
});
