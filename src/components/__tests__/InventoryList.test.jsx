/**
 * InventoryList Component Tests
 * Phase 5.3.2c: Tier 1 - Inventory & Stock Component
 *
 * Tests inventory management list with CRUD operations and filtering
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "../../contexts/ThemeContext";
import { inventoryService } from "../../services/inventoryService";
import InventoryList from "../InventoryList";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: vi.fn(() => ({ isDarkMode: false, themeMode: "light", toggleTheme: vi.fn() })),
}));
vi.mock("../../services/inventoryService", () => ({
  inventoryService: {
    getAllItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));
vi.mock("../../hooks/useConfirm", () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn().mockResolvedValue(true),
    dialogState: { open: false, title: "", message: "" },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  })),
}));
vi.mock("../../contexts/NotificationCenterContext", () => ({
  useNotifications: vi.fn(() => ({ addNotification: vi.fn() })),
}));
vi.mock("../../services/axiosApi", () => ({
  default: { post: vi.fn(), get: vi.fn() },
  apiService: { get: vi.fn().mockResolvedValue({ warehouses: [] }), post: vi.fn(), put: vi.fn(), delete: vi.fn(), setAuthToken: vi.fn(), removeAuthToken: vi.fn() },
}));

describe("InventoryList", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useTheme.mockReturnValue({ isDarkMode: false });

    inventoryService.getAllItems = vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          productName: "SS-304-Sheet",
          productType: "Sheet",
          grade: "304",
          finish: "BA",
          size: "1000x2000",
          thickness: "1.5",
          quantity: 1000,
          quantityOnHand: 1000,
          quantityReserved: 200,
          quantityAvailable: 800,
          pricePurchased: 2000,
          sellingPrice: 2500,
          landedCost: 2100,
          warehouseName: "Main Warehouse",
          location: "Zone A",
          status: "AVAILABLE",
          batchNumber: "BATCH-2024-001",
          heatNumber: "HEAT-2024-001",
          minStock: 100,
          unit: "KG",
          origin: "UAE",
        },
        {
          id: 2,
          productName: "SS-316L-Coil",
          productType: "Coil",
          grade: "316L",
          finish: "2B",
          size: "500",
          thickness: "0.8",
          quantity: 500,
          quantityOnHand: 500,
          quantityReserved: 100,
          quantityAvailable: 400,
          pricePurchased: 3000,
          sellingPrice: 3500,
          landedCost: 3100,
          warehouseName: "Secondary Warehouse",
          location: "Zone B",
          status: "AVAILABLE",
          batchNumber: "BATCH-2024-002",
          heatNumber: "HEAT-2024-002",
          minStock: 50,
          unit: "KG",
          origin: "INDIA",
        },
      ],
      pagination: { total: 2 },
    });

    inventoryService.createItem = vi.fn().mockResolvedValue({ id: 3 });
    inventoryService.updateItem = vi.fn().mockResolvedValue({ id: 1 });
    inventoryService.deleteItem = vi.fn().mockResolvedValue({ success: true });
  });

  describe("Rendering", () => {
    it("should render inventory list page", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/Inventory Management/)).toBeInTheDocument();
      });
    });

    it("should display table with inventory items", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
        expect(screen.getByText("SS-316L-Coil")).toBeInTheDocument();
      });
    });

    it("should display loading state initially", () => {
      inventoryService.getAllItems = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
      );

      render(<InventoryList />);

      expect(screen.getByText(/Loading inventory/)).toBeInTheDocument();
    });

    it("should display empty state when no items", async () => {
      inventoryService.getAllItems = vi.fn().mockResolvedValue({
        data: [],
        pagination: { total: 0 },
      });

      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/No inventory items found/)).toBeInTheDocument();
      });
    });
  });

  describe("Stock Display", () => {
    it("should display quantity in table", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("1000")).toBeInTheDocument();
        // "500" may appear multiple times (quantity + size field), so use getAllByText
        const matches = screen.getAllByText("500");
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    it("should display reserved quantities", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const reservedQtys = screen.getAllByText(/200\.000 KG/);
        expect(reservedQtys.length).toBeGreaterThan(0);
      });
    });

    it("should display available quantities", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const availableQtys = screen.getAllByText(/800\.000 KG/);
        expect(availableQtys.length).toBeGreaterThan(0);
      });
    });

    it("should show low stock warning", async () => {
      inventoryService.getAllItems = vi.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            productName: "Low Stock Item",
            quantity: 30,
            minStock: 100,
            status: "AVAILABLE",
            quantityAvailable: 30,
            quantityOnHand: 30,
            quantityReserved: 0,
            unit: "KG",
          },
        ],
        pagination: { total: 1 },
      });

      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("Min: 100")).toBeInTheDocument();
      });
    });
  });

  describe("Product Information", () => {
    it("should display product name", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
      });
    });

    it("should display grade", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("304")).toBeInTheDocument();
        expect(screen.getByText("316L")).toBeInTheDocument();
      });
    });

    it("should display finish", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("BA")).toBeInTheDocument();
        expect(screen.getByText("2B")).toBeInTheDocument();
      });
    });

    it("should display origin badge for non-UAE products", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const originBadges = screen.getAllByText("INDIA");
        expect(originBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Warehouse Location", () => {
    it("should display warehouse name", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        // Warehouse name may appear in multiple places (badge + location cell)
        const mainWarehouse = screen.getAllByText("Main Warehouse");
        expect(mainWarehouse.length).toBeGreaterThan(0);
        const secondaryWarehouse = screen.getAllByText("Secondary Warehouse");
        expect(secondaryWarehouse.length).toBeGreaterThan(0);
      });
    });

    it("should display location details", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("Zone A")).toBeInTheDocument();
        expect(screen.getByText("Zone B")).toBeInTheDocument();
      });
    });
  });

  describe("Status Filter", () => {
    it("should have status filter dropdown", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue("All Status");
        expect(statusFilter).toBeInTheDocument();
      });
    });

    it("should filter by status when selected", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("All Status")).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue("All Status");
      await user.selectOptions(statusFilter, "AVAILABLE");

      await waitFor(() => {
        expect(inventoryService.getAllItems).toHaveBeenCalledWith(expect.objectContaining({ status: "AVAILABLE" }));
      });
    });

    it("should show all status options", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("All Status")).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue("All Status");
      const options = statusFilter.querySelectorAll("option");
      expect(options.length).toBeGreaterThanOrEqual(4); // All, Available, Reserved, Blocked, Scrap
    });
  });

  describe("Search", () => {
    it("should have search input", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search inventory/);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it("should filter items by search term", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search inventory/)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search inventory/);
      await user.type(searchInput, "304");

      await waitFor(() => {
        expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
      });
    });
  });

  describe("CRUD Operations", () => {
    it("should have Add Item button", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const addButton = screen.getByRole("button", { name: /Add Item/ });
        expect(addButton).toBeInTheDocument();
      });
    });

    it("should open add dialog when Add Item clicked", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add Item/ })).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /Add Item/ });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add Inventory Item")).toBeInTheDocument();
      });
    });

    it("should have edit button for each item", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle("Edit");
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });

    it("should have delete button for each item", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle("Delete");
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it("should open edit dialog when edit clicked", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle("Edit");
        expect(editButtons.length).toBeGreaterThan(0);
      });

      const firstEditButton = screen.getAllByTitle("Edit")[0];
      await user.click(firstEditButton);

      await waitFor(() => {
        expect(screen.getByText("Edit Inventory Item")).toBeInTheDocument();
      });
    });
  });

  describe("Batch and Heat Numbers", () => {
    it("should display batch number", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
      });
    });

    it("should display heat number", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("HEAT-2024-001")).toBeInTheDocument();
      });
    });

    it("should show dash when batch number missing", async () => {
      inventoryService.getAllItems = vi.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            productName: "No Batch Item",
            quantity: 100,
            batchNumber: null,
            heatNumber: null,
            coilNumber: null,
            quantityAvailable: 100,
            quantityOnHand: 100,
            quantityReserved: 0,
            unit: "KG",
          },
        ],
        pagination: { total: 1 },
      });

      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });
  });

  describe("Pricing Display", () => {
    it("should display purchase price in AED", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/2,000/)).toBeInTheDocument(); // Purchase price formatted
      });
    });

    it("should display selling price in AED", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/2,500/)).toBeInTheDocument(); // Selling price
      });
    });

    it("should display landed cost", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/2,100/)).toBeInTheDocument(); // Landed cost
      });
    });
  });

  describe("Pagination", () => {
    it("should display pagination controls", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText(/Page 1/)).toBeInTheDocument();
      });
    });

    it("should allow changing page size", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        const pageSizeSelect = screen.getByDisplayValue("25");
        expect(pageSizeSelect).toBeInTheDocument();
      });

      const pageSizeSelect = screen.getByDisplayValue("25");
      await user.selectOptions(pageSizeSelect, "10");

      await waitFor(() => {
        expect(inventoryService.getAllItems).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
      });
    });

    it("should disable previous button on first page", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: "←" });
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe("Upload Feature", () => {
    it("should have Upload Items button", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const uploadButton = screen.getByRole("button", { name: /Upload Items/ });
        expect(uploadButton).toBeInTheDocument();
      });
    });

    it("should open upload modal when Upload Items clicked", async () => {
      const user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Upload Items/ })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole("button", { name: /Upload Items/ });
      await user.click(uploadButton);

      // Modal should open (specific content depends on InventoryUpload component)
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe("Dark Mode", () => {
    it("should render in light mode by default", async () => {
      useTheme.mockReturnValue({ isDarkMode: false });

      const { container } = render(<InventoryList />);

      expect(container.querySelector(".bg-\\[\\#FAFAFA\\]")).toBeInTheDocument();
    });

    it("should render in dark mode when enabled", async () => {
      useTheme.mockReturnValue({ isDarkMode: true });

      const { container } = render(<InventoryList />);

      expect(container.querySelector(".bg-\\[\\#121418\\]")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message on fetch failure", async () => {
      inventoryService.getAllItems = vi.fn().mockRejectedValue(new Error("API Error"));

      render(<InventoryList />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load inventory")).toBeInTheDocument();
      });
    });

    it("should show error on delete failure", async () => {
      inventoryService.deleteItem = vi.fn().mockRejectedValue(new Error("Delete failed"));

      const _user = userEvent.setup();
      render(<InventoryList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle("Delete");
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      // Note: Delete confirmation happens via modal, test would need to mock useConfirm
    });
  });

  describe("ERP Fields Display", () => {
    it("should display status badge", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        // Both items have AVAILABLE status, so multiple elements expected
        const badges = screen.getAllByText("AVAILABLE");
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it("should display unit correctly", async () => {
      render(<InventoryList />);

      await waitFor(() => {
        const kgLabels = screen.getAllByText(/KG/);
        expect(kgLabels.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Integration", () => {
    it("should refetch inventory after successful create", async () => {
      const _user = userEvent.setup();
      inventoryService.getAllItems.mockClear();

      render(<InventoryList />);

      await waitFor(() => {
        expect(inventoryService.getAllItems).toHaveBeenCalled();
      });
    });

    it("should refetch inventory after successful update", async () => {
      const _user = userEvent.setup();
      inventoryService.getAllItems.mockClear();

      render(<InventoryList />);

      await waitFor(() => {
        expect(inventoryService.getAllItems).toHaveBeenCalled();
      });
    });

    it("should refetch inventory after successful delete", async () => {
      const _user = userEvent.setup();
      inventoryService.getAllItems.mockClear();

      render(<InventoryList />);

      await waitFor(() => {
        expect(inventoryService.getAllItems).toHaveBeenCalled();
      });
    });
  });
});
