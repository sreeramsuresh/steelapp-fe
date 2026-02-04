/**
 * StockReservationToggle Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests stock reservation toggle with 2-hour expiration timer
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockReservationToggle from "../StockReservationToggle";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("StockReservationToggle", () => {
  let mockOnToggleReservation;

  beforeEach(() => {
    mockOnToggleReservation = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render Reserve button when stock is not reserved", () => {
    const item = {
      stockReserved: false,
      reservationExpiry: null,
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.getByRole("button", { name: /Reserve/ })).toBeInTheDocument();
  });

  it("should render Reserved button when stock is reserved", () => {
    const item = {
      stockReserved: true,
      reservationExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.getByRole("button", { name: /Reserved/ })).toBeInTheDocument();
  });

  it("should call onToggleReservation with true and 2-hour expiry when Reserve is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const item = {
      stockReserved: false,
      reservationExpiry: null,
    };

    const now = new Date();
    vi.setSystemTime(now);

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    const button = screen.getByRole("button", { name: /Reserve/ });
    await user.click(button);

    expect(mockOnToggleReservation).toHaveBeenCalledWith(
      0,
      true,
      expect.stringContaining("T")
    );

    // Verify the expiry time is approximately 2 hours from now
    const callArgs = mockOnToggleReservation.mock.calls[0];
    const expiryTime = new Date(callArgs[2]);
    const diffMs = expiryTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(1.99);
    expect(diffHours).toBeLessThan(2.01);
  });

  it("should call onToggleReservation with false when Reserved is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const item = {
      stockReserved: true,
      reservationExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    const button = screen.getByRole("button", { name: /Reserved/ });
    await user.click(button);

    expect(mockOnToggleReservation).toHaveBeenCalledWith(0, false, null);
  });

  it("should display countdown timer when stock is reserved", async () => {
    const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000 + 30 * 60 * 1000); // 1h 30m from now
    const item = {
      stockReserved: true,
      reservationExpiry: futureTime.toISOString(),
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    await waitFor(() => {
      // The timer should display approximately 1h 30m remaining
      expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    });
  });

  it("should update countdown timer every second", async () => {
    const futureTime = new Date(Date.now() + 5 * 1000); // 5 seconds from now
    const item = {
      stockReserved: true,
      reservationExpiry: futureTime.toISOString(),
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    await waitFor(() => {
      expect(screen.getByText(/0h 0m 5s/)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/0h 0m 4s/)).toBeInTheDocument();
    });
  });

  it("should display Expired when reservation time has passed", async () => {
    const pastTime = new Date(Date.now() - 1000); // 1 second ago
    const item = {
      stockReserved: true,
      reservationExpiry: pastTime.toISOString(),
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    await waitFor(() => {
      expect(screen.getByText("Expired")).toBeInTheDocument();
    });
  });

  it("should not display timer when stock is not reserved", () => {
    const item = {
      stockReserved: false,
      reservationExpiry: null,
    };

    render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.queryByText(/h [0-9]+m [0-9]+s/)).not.toBeInTheDocument();
  });

  it("should clear timer when component unmounts", () => {
    const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
    const item = {
      stockReserved: true,
      reservationExpiry: futureTime.toISOString(),
    };

    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(
      <StockReservationToggle item={item} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should reset timer when stockReserved changes from true to false", async () => {
    const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
    const item1 = {
      stockReserved: true,
      reservationExpiry: futureTime.toISOString(),
    };

    const { rerender } = render(
      <StockReservationToggle item={item1} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    await waitFor(() => {
      expect(screen.getByText(/0h 59m/)).toBeInTheDocument();
    });

    const item2 = {
      stockReserved: false,
      reservationExpiry: null,
    };

    rerender(
      <StockReservationToggle item={item2} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.queryByText(/h [0-9]+m [0-9]+s/)).not.toBeInTheDocument();
  });

  it("should display correct title attributes", () => {
    const item1 = {
      stockReserved: false,
      reservationExpiry: null,
    };

    const { rerender } = render(
      <StockReservationToggle item={item1} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.getByTitle(/Reserve stock/)).toBeInTheDocument();

    const item2 = {
      stockReserved: true,
      reservationExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    };

    rerender(
      <StockReservationToggle item={item2} index={0} onToggleReservation={mockOnToggleReservation} />
    );

    expect(screen.getByTitle(/Release reservation/)).toBeInTheDocument();
  });

  it("should handle index prop correctly when toggling", async () => {
    const user = userEvent.setup({ delay: null });
    const item = {
      stockReserved: false,
      reservationExpiry: null,
    };

    render(
      <StockReservationToggle item={item} index={5} onToggleReservation={mockOnToggleReservation} />
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(mockOnToggleReservation.mock.calls[0][0]).toBe(5);
  });
});
