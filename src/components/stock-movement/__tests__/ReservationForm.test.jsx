import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Main Warehouse", isDefault: true }] }),
  },
}));

vi.mock("../../../services/dataService", () => ({
  productService: {
    getProducts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    getCurrentStock: vi.fn().mockResolvedValue({ warehouses: [] }),
    createReservation: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../services/batchReservationService", () => ({
  batchReservationService: {
    getAvailableBatches: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("../../../utils/fieldAccessors", () => ({
  getProductUniqueName: (p) => p.name || "Product",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatDateDMY: (d) => d || "-",
}));

vi.mock("../../../utils/productSsotValidation", () => ({
  validateSsotPattern: () => ({ isValid: true }),
}));

import ReservationForm from "../ReservationForm";

describe("ReservationForm", () => {
  it("returns null when not open", () => {
    const { container } = render(<ReservationForm open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders form title when open", () => {
    render(<ReservationForm open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Create Stock Reservation")).toBeInTheDocument();
  });

  it("renders cancel and create buttons", () => {
    render(<ReservationForm open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create Reservation")).toBeInTheDocument();
  });
});
