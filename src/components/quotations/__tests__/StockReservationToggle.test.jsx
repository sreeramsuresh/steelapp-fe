import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import StockReservationToggle from "../StockReservationToggle";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("StockReservationToggle", () => {
  it("shows Reserve button when not reserved", () => {
    renderWithTheme(
      <StockReservationToggle
        item={{ stockReserved: false }}
        index={0}
        onToggleReservation={vi.fn()}
      />
    );
    expect(screen.getByText("Reserve")).toBeInTheDocument();
  });

  it("shows Reserved button when reserved", () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    renderWithTheme(
      <StockReservationToggle
        item={{ stockReserved: true, reservationExpiry: future }}
        index={0}
        onToggleReservation={vi.fn()}
      />
    );
    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });

  it("calls onToggleReservation with false when releasing", () => {
    const onToggle = vi.fn();
    const future = new Date(Date.now() + 3600000).toISOString();
    renderWithTheme(
      <StockReservationToggle
        item={{ stockReserved: true, reservationExpiry: future }}
        index={2}
        onToggleReservation={onToggle}
      />
    );
    screen.getByText("Reserved").click();
    expect(onToggle).toHaveBeenCalledWith(2, false, null);
  });

  it("calls onToggleReservation with true when reserving", () => {
    const onToggle = vi.fn();
    renderWithTheme(
      <StockReservationToggle
        item={{ stockReserved: false }}
        index={1}
        onToggleReservation={onToggle}
      />
    );
    screen.getByText("Reserve").click();
    expect(onToggle).toHaveBeenCalledWith(1, true, expect.any(String));
  });

  it("shows Expired when reservation has expired", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    renderWithTheme(
      <StockReservationToggle
        item={{ stockReserved: true, reservationExpiry: past }}
        index={0}
        onToggleReservation={vi.fn()}
      />
    );
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });
});
