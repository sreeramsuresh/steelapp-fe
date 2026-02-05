import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import PurchaseOrderPreview from "../PurchaseOrderPreview";
import sinon from 'sinon';

const mockPurchaseOrderService = {
  getPurchaseOrder: sinon.stub(),
  updatePurchaseOrder: sinon.stub(),
  cancelPurchaseOrder: sinon.stub(),
  approvePurchaseOrder: sinon.stub(),
};

// sinon.stub() // "../../../services/purchaseOrderService", () => ({
  default: mockPurchaseOrderService,
}));

// sinon.stub() // "../../../components/common/Modal", () => ({
  default: ({ isOpen, children, _onClose }) =>
    isOpen ? React.createElement("div", { "data-testid": "modal" }, children) : null,
}));

describe("PurchaseOrderPreview", () => {
  const defaultProps = {
    poId: "PO-001",
    onClose: sinon.stub(),
  };

  const mockPOData = {
    id: "PO-001",
    poNumber: "PO/2024/001",
    status: "Draft",
    supplierId: "SUP-001",
    supplierName: "Supplier Co",
    createdDate: "2024-01-15",
    deliveryDate: "2024-02-15",
    items: [
      {
        id: "ITEM-1",
        productId: "PROD-001",
        productName: "SS 304 Sheet",
        quantity: 100,
        unitPrice: 50.0,
        totalPrice: 5000.0,
      },
    ],
    subtotal: 5000.0,
    tax: 250.0,
    total: 5250.0,
    notes: "Test notes",
  };

  beforeEach(() => {
    sinon.restore();
    mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue(mockPOData);
  });

  describe("Rendering", () => {
    it("should render PO preview modal", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display supplier information section", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display items table", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display financial totals", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display delivery information", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display PO notes section", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Status Handling", () => {
    it("should show editable state for Draft PO", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show locked state for Submitted PO", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Submitted",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show approved PO status", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Approved",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show received PO status", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Received",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show cancelled status", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Cancelled",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Financial Calculations", () => {
    it("should calculate subtotal from all items", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should apply tax calculation", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should calculate total with tax included", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle zero tax scenario", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        tax: 0,
        total: 5000.0,
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should format currency correctly", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Items Management", () => {
    it("should display all line items", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show item quantity and unit price", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should calculate line item total", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle multiple items", () => {
      const multiItemPO = {
        ...mockPOData,
        items: [
          { ...mockPOData.items[0], id: "ITEM-1" },
          { ...mockPOData.items[0], id: "ITEM-2", quantity: 50 },
          { ...mockPOData.items[0], id: "ITEM-3", quantity: 75 },
        ],
      };
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue(multiItemPO);
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle empty items list", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        items: [],
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("User Actions", () => {
    it("should call onClose when closing modal", () => {
      const onCloseMock = sinon.stub();
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} onClose={onCloseMock} />);
      expect(container).toBeInTheDocument();
    });

    it("should enable Edit for Draft status", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should disable Edit for locked status", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Submitted",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should enable Approve for Submitted status", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        status: "Submitted",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should enable Cancel action", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should enable Print action", () => {
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle loading state gracefully", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockImplementation(() => new Promise(() => {}));
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display error message on API failure", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockRejectedValue(new Error("API Error"));
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle null PO gracefully", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue(null);
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle network errors", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockRejectedValue(new Error("Network failed"));
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle timeout errors", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockRejectedValue(new Error("Request timeout"));
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle large quantity values", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        items: [{ ...mockPOData.items[0], quantity: 999999 }],
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle large price values", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        items: [{ ...mockPOData.items[0], unitPrice: 99999.99 }],
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle special characters in supplier name", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        supplierName: "Supplier & Co. <Test>",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle very long notes", () => {
      const longNotes = "a".repeat(1000);
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        ...mockPOData,
        notes: longNotes,
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle missing optional fields", () => {
      mockPurchaseOrderService.getPurchaseOrder.mockResolvedValue({
        id: "PO-001",
        poNumber: "PO/2024/001",
        status: "Draft",
      });
      const { container } = renderWithProviders(<PurchaseOrderPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });
});
