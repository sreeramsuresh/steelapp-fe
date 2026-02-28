import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (v) => `AED ${v}`,
}));

import BatchCostTable from "../BatchCostTable";

describe("BatchCostTable", () => {
  it("renders without crashing with empty batches", () => {
    const { container } = render(<BatchCostTable batches={[]} />);
    expect(container).toBeTruthy();
  });

  it("renders batch rows when provided", () => {
    const batches = [
      {
        id: 1,
        batchNumber: "B-001",
        procurementChannel: "LOCAL",
        unitCost: 90,
        quantityOnHand: 100,
        unit: "KG",
        createdAt: "2026-01-15",
      },
    ];
    render(<BatchCostTable batches={batches} />);
    expect(screen.getByText("B-001")).toBeInTheDocument();
  });
});
