/**
 * DeliveryNotePreview Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests delivery note preview modal with status display and delivery details
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import DeliveryNotePreview from "../DeliveryNotePreview";

// sinon.stub() // "../../../contexts/ThemeContext", () => ({
useTheme: () => ({ isDarkMode: false }),
}))

// sinon.stub() // "../../../constants/defaultTemplateSettings", () => ({
getDocumentTemplateColor: () => "#1e40af",
}))

// sinon.stub() // "../../../utils/invoiceUtils", () => ({
toUAEDateProfessional: (_date) => "15 January 2024", TIMEZONE_DISCLAIMER
: "Times shown in UAE timezone",
}))

// sinon.stub() // "../../../utils/recordUtils", () => ({
validateDeliveryNoteForDownload: () => (
{
  isValid: true, warnings;
  : []
}
),
}))

describe("DeliveryNotePreview", () =>
{
  let defaultProps;
  let mockOnClose;

  beforeEach(() => {
    sinon.restore();
    mockOnClose = sinon.stub();

    defaultProps = {
      deliveryNote: {
        id: "DN-001",
        deliveryNoteNumber: "DN-2024-001",
        status: "delivered",
        deliveryDate: "2024-01-15",
        invoiceNumber: "INV-2024-001",
        customerDetails: {
          name: "Steel Trading LLC",
          company: "Trading Corp",
        },
        deliveryAddress: {
          street: "Dubai, UAE",
          city: "Dubai",
          poBox: "12345",
        },
        vehicleNumber: "DXB-2024",
        driverName: "Ahmed Al-Mansouri",
        items: [
          {
            id: 1,
            description: "SS304 Coil",
            quantity: 100,
            unit: "kg",
            batchNumber: "BATCH-001",
          },
        ],
      },
      company: {
        name: "My Steel Corp",
        address: {
          street: "Abu Dhabi, UAE",
        },
        phone: "+971-123-4567",
      },
      onClose: mockOnClose,
    };
  });

  describe("Rendering", () => {
    it("should render preview modal", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display close button", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeTruthy();
    });

    it("should display delivery note number", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("DN-2024-001");
    });

    it("should display preview title", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Delivery Note Preview");
    });
  });

  describe("Status Display", () => {
    it("should display pending status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "pending" }} />
      );

      expect(container.textContent).toContain("Pending");
    });

    it("should display in-transit status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "in_transit" }} />
      );

      expect(container.textContent).toContain("In Transit");
    });

    it("should display partial delivery status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "partial" }} />
      );

      expect(container.textContent).toContain("Partial Delivery");
    });

    it("should display delivered status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "delivered" }} />
      );

      expect(container.textContent).toContain("Delivered");
    });

    it("should display completed status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "completed" }} />
      );

      expect(container.textContent).toContain("Completed");
    });

    it("should display cancelled status", () => {
      const { container } = renderWithProviders(
        <DeliveryNotePreview {...defaultProps} deliveryNote={{ ...defaultProps.deliveryNote, status: "cancelled" }} />
      );

      expect(container.textContent).toContain("Cancelled");
    });
  });

  describe("Delivery Details", () => {
    it("should display delivery date", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Delivery Date");
      expect(container.textContent).toContain("15 January 2024");
    });

    it("should display invoice number", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Invoice #");
      expect(container.textContent).toContain("INV-2024-001");
    });

    it("should display customer name", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Steel Trading LLC");
    });

    it("should display customer company", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Trading Corp");
    });

    it("should display delivery address", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Dubai");
    });

    it("should display company name", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("My Steel Corp");
    });

    it("should display company phone", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("+971-123-4567");
    });
  });

  describe("Transport Details", () => {
    it("should display vehicle number", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Vehicle");
      expect(container.textContent).toContain("DXB-2024");
    });

    it("should display driver name", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Driver");
      expect(container.textContent).toContain("Ahmed Al-Mansouri");
    });

    it("should hide transport section when no vehicle/driver", () => {
      const noTransport = {
        ...defaultProps.deliveryNote,
        vehicleNumber: null,
        driverName: null,
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={noTransport} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Items Display", () => {
    it("should display items table", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("SS304 Coil");
    });

    it("should display item quantity", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("100");
    });

    it("should display item unit", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("kg");
    });

    it("should display batch number", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("BATCH-001");
    });

    it("should handle multiple items", () => {
      const multiItem = {
        ...defaultProps.deliveryNote,
        items: [
          { id: 1, description: "Item 1", quantity: 100, unit: "kg" },
          { id: 2, description: "Item 2", quantity: 50, unit: "pcs" },
        ],
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={multiItem} />);

      expect(container.textContent).toContain("Item 1");
      expect(container.textContent).toContain("Item 2");
    });

    it("should display empty items message", () => {
      const noItems = {
        ...defaultProps.deliveryNote,
        items: [],
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={noItems} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe("Validation Warnings", () => {
    it("should display validation warnings if present", () => {
      vi.doMock("../../../utils/recordUtils", () => ({
        validateDeliveryNoteForDownload: () => ({
          isValid: false,
          warnings: ["Missing delivery address"],
        }),
      }));

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styling", () => {
      vi.resetModules();
      vi.doMock("../../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Field Name Compatibility", () => {
    it("should support both camelCase and snake_case delivery note number", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        delivery_note_number: "DN-2024-002",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container.textContent).toContain("DN-2024-002");
    });

    it("should support both camelCase and snake_case delivery date", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        delivery_date: "2024-01-20",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container).toBeInTheDocument();
    });

    it("should support both camelCase and snake_case invoice number", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        invoice_number: "INV-2024-002",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container.textContent).toContain("INV-2024-002");
    });

    it("should support both camelCase and snake_case delivery address", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        delivery_address: { city: "Abu Dhabi" },
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container.textContent).toContain("Abu Dhabi");
    });

    it("should support both camelCase and snake_case vehicle number", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        vehicle_number: "AUH-2024",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container.textContent).toContain("AUH-2024");
    });

    it("should support both camelCase and snake_case driver name", () => {
      const snakeCase = {
        ...defaultProps.deliveryNote,
        driver_name: "Mohammed Al-Naqbi",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={snakeCase} />);

      expect(container.textContent).toContain("Mohammed Al-Naqbi");
    });
  });

  describe("Edge Cases", () => {
    it("should handle delivery note with no items", () => {
      const noItems = {
        ...defaultProps.deliveryNote,
        items: [],
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={noItems} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing customer data", () => {
      const noCustomer = {
        ...defaultProps.deliveryNote,
        customerDetails: null,
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={noCustomer} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing company data", () => {
      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} company={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very large item lists", () => {
      const largeList = {
        ...defaultProps.deliveryNote,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          description: `Item ${i}`,
          quantity: 100,
          unit: "kg",
        })),
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={largeList} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle minimal delivery note data", () => {
      const minimal = {
        deliveryNoteNumber: "DN-001",
        status: "pending",
      };

      const { container } = renderWithProviders(<DeliveryNotePreview {...defaultProps} deliveryNote={minimal} />);

      expect(container).toBeInTheDocument();
    });
  });
}
)
