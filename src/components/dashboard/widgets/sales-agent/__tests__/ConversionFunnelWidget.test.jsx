import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ConversionFunnelWidget from "../ConversionFunnelWidget";

describe("ConversionFunnelWidget", () => {
  it("renders without crashing", () => {
    render(<ConversionFunnelWidget />);
  });

  it("displays funnel content with mock data", () => {
    render(<ConversionFunnelWidget />);
    expect(screen.getByText(/Quotes Sent/i)).toBeInTheDocument();
  });

  it("displays follow-ups stage", () => {
    render(<ConversionFunnelWidget />);
    expect(screen.getByText(/Follow-ups/i)).toBeInTheDocument();
  });

  it("renders with custom data", () => {
    const data = {
      period: "This Month",
      stages: [
        { name: "Quotes", count: 50, value: 5000000 },
        { name: "Converted", count: 30, value: 3000000 },
      ],
      overallConversion: 60,
    };
    render(<ConversionFunnelWidget data={data} />);
    // Should render without crashing
  });
});
