import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

import ReservationDetailView from "../ReservationDetailView";

const mockReservation = {
  reservationNumber: "RES-001",
  status: "ACTIVE",
  productName: "SS-304-Sheet",
  productSku: "SKU-001",
  warehouseName: "Main Warehouse",
  quantityReserved: "100",
  quantityFulfilled: "50",
  quantityRemaining: "50",
  unit: "KG",
  createdAt: "2026-01-15T10:00:00Z",
  expiryDate: "2026-03-01",
  createdByName: "Admin User",
};

describe("ReservationDetailView", () => {
  it("returns null when no reservation provided", () => {
    const { container } = render(<ReservationDetailView reservation={null} onBack={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders reservation number", () => {
    render(<ReservationDetailView reservation={mockReservation} onBack={vi.fn()} />);
    expect(screen.getByText("RES-001")).toBeInTheDocument();
  });

  it("renders product and warehouse info", () => {
    render(<ReservationDetailView reservation={mockReservation} onBack={vi.fn()} />);
    expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
  });

  it("shows quantity breakdown section", () => {
    render(<ReservationDetailView reservation={mockReservation} onBack={vi.fn()} />);
    expect(screen.getByText("Quantity Breakdown")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
