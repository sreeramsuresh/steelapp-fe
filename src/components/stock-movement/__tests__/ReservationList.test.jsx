import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    listReservations: vi.fn().mockResolvedValue({ data: [], pagination: { totalItems: 0 } }),
    fulfillReservation: vi.fn(),
    cancelReservation: vi.fn(),
  },
  RESERVATION_STATUSES: {
    ACTIVE: { value: "ACTIVE", label: "Active", color: "primary" },
    FULFILLED: { value: "FULFILLED", label: "Fulfilled", color: "success" },
  },
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

import ReservationList from "../ReservationList";

describe("ReservationList", () => {
  it("renders without crashing", () => {
    const { container } = render(<ReservationList onCreateNew={vi.fn()} onViewReservation={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("shows New Reservation button", () => {
    render(<ReservationList onCreateNew={vi.fn()} onViewReservation={vi.fn()} />);
    expect(screen.getByText("New Reservation")).toBeInTheDocument();
  });

  it("shows search input", () => {
    render(<ReservationList onCreateNew={vi.fn()} onViewReservation={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search reservations...")).toBeInTheDocument();
  });
});
