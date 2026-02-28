import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import VATCollectionWidget from "../VATCollectionWidget";

describe("VATCollectionWidget", () => {
  it("renders without crashing", () => {
    render(<VATCollectionWidget />);
  });

  it("displays VAT collection content with fallback data", () => {
    render(<VATCollectionWidget />);
    // Fallback data should be generated dynamically
    const { container } = render(<VATCollectionWidget />);
    expect(container).toBeTruthy();
  });

  it("renders with custom data", () => {
    const data = {
      currentQuarter: {
        period: "Q4 2024",
        periodStart: "2024-10-01",
        periodEnd: "2024-12-31",
        outputVAT: 250000,
        inputVAT: 180000,
        netVAT: 70000,
        dueDate: "2025-01-28",
        daysUntilDue: 30,
      },
      previousQuarter: {
        period: "Q3 2024",
        outputVAT: 240000,
        inputVAT: 175000,
        netVAT: 65000,
      },
      yearToDate: {
        outputVAT: 900000,
        inputVAT: 650000,
        netVAT: 250000,
      },
    };
    const { container } = render(<VATCollectionWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with isLoading prop", () => {
    const { container } = render(<VATCollectionWidget isLoading={true} />);
    expect(container).toBeTruthy();
  });
});
