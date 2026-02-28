import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import VATReturnStatusWidget from "../VATReturnStatusWidget";

describe("VATReturnStatusWidget", () => {
  it("renders without crashing", () => {
    render(<VATReturnStatusWidget />);
  });

  it("renders with no data", () => {
    const { container } = render(<VATReturnStatusWidget data={null} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom data", () => {
    const data = {
      quarters: [
        {
          quarter: "Q4 2024",
          status: "submitted",
          filingDate: "2025-01-28",
          amount: 70000,
        },
      ],
      currentQuarter: "Q1 2025",
    };
    render(<VATReturnStatusWidget data={data} />);
    const { container } = render(<VATReturnStatusWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with callbacks", () => {
    const onGenerateReturn = vi.fn();
    const onViewReturn = vi.fn();
    const { container } = render(
      <VATReturnStatusWidget onGenerateReturn={onGenerateReturn} onViewReturn={onViewReturn} />
    );
    expect(container).toBeTruthy();
  });
});
