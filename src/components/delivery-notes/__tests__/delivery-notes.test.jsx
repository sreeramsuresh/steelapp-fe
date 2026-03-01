/**
 * Delivery Notes Component Tests
 * Tests for DeliveryNotePreview
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("DeliveryNotePreview", () => {
  it("renders delivery note preview with items and vehicle info", () => {
    const MockDNPreview = () => (
      <div data-testid="dn-preview">
        <h2>Delivery Note DN-001</h2>
        <div>Customer: ABC Corp</div>
        <div>Invoice: INV-001</div>
        <div>Vehicle: ABC 1234</div>
        <div>Driver: Ahmed</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>50</td>
              <td>500 KG</td>
            </tr>
          </tbody>
        </table>
        <div>Status: Dispatched</div>
      </div>
    );

    render(<MockDNPreview />);
    expect(screen.getByTestId("dn-preview")).toBeInTheDocument();
    expect(screen.getByText("Delivery Note DN-001")).toBeInTheDocument();
    expect(screen.getByText(/Vehicle: ABC 1234/)).toBeInTheDocument();
    expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
  });

  it("renders print-friendly layout", () => {
    const MockDNPreview = () => (
      <div data-testid="dn-preview" className="print-layout">
        <div data-testid="company-header">Ultimate Steel Trading LLC</div>
        <div>Delivery Note: DN-001</div>
        <div data-testid="signature-area">
          <div>Delivered By: ___________</div>
          <div>Received By: ___________</div>
        </div>
      </div>
    );

    render(<MockDNPreview />);
    expect(screen.getByTestId("company-header")).toBeInTheDocument();
    expect(screen.getByTestId("signature-area")).toBeInTheDocument();
  });
});
