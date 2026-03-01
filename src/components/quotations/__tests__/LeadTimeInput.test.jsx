import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import LeadTimeInput from "../LeadTimeInput";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("LeadTimeInput", () => {
  it("returns null when sourceType is not TO_BE_PROCURED", () => {
    const { container } = renderWithTheme(
      <LeadTimeInput item={{ sourceType: "WAREHOUSE", productId: 1 }} index={0} onUpdate={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders when sourceType is TO_BE_PROCURED", () => {
    renderWithTheme(<LeadTimeInput item={{ sourceType: "TO_BE_PROCURED" }} index={0} onUpdate={vi.fn()} />);
    expect(screen.getByText("Lead Time:")).toBeInTheDocument();
    expect(screen.getByText("days")).toBeInTheDocument();
  });

  it("renders when no productId", () => {
    renderWithTheme(<LeadTimeInput item={{ sourceType: "WAREHOUSE" }} index={0} onUpdate={vi.fn()} />);
    expect(screen.getByText("Lead Time:")).toBeInTheDocument();
  });

  it("shows current lead time value", () => {
    renderWithTheme(
      <LeadTimeInput item={{ sourceType: "TO_BE_PROCURED", estimatedLeadTimeDays: 14 }} index={0} onUpdate={vi.fn()} />
    );
    expect(screen.getByDisplayValue("14")).toBeInTheDocument();
  });

  it("shows description text", () => {
    renderWithTheme(<LeadTimeInput item={{ sourceType: "TO_BE_PROCURED" }} index={0} onUpdate={vi.fn()} />);
    expect(screen.getByText(/Expected days for supplier/)).toBeInTheDocument();
  });
});
