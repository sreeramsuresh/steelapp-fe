import { render, screen } from "@testing-library/react";
import { CheckCircle, FileText } from "lucide-react";
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
        { name: "Quotes Sent", count: 50, value: 5000000, icon: FileText, color: "from-blue-500 to-blue-600" },
        { name: "Converted", count: 30, value: 3000000, icon: CheckCircle, color: "from-green-500 to-green-600" },
      ],
      metrics: {
        overallConversionRate: 60,
        previousConversionRate: 55,
        avgQuoteValue: 100000,
        avgDealSize: 100000,
        avgDaysToConvert: 14,
      },
      topReasons: [],
    };
    render(<ConversionFunnelWidget data={data} />);
    // Should render without crashing
  });
});
