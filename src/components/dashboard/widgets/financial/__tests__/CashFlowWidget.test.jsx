import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CashFlowWidget from "../CashFlowWidget";

describe("CashFlowWidget", () => {
  it("renders without crashing", () => {
    render(<CashFlowWidget />);
  });

  it("displays the widget title", () => {
    render(<CashFlowWidget />);
    expect(screen.getByText("Cash Flow")).toBeInTheDocument();
  });

  it("shows no data message when no data provided", () => {
    render(<CashFlowWidget />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows inflows, outflows, and net when data is provided", () => {
    const data = {
      mtd: {
        inflows: 500000,
        outflows: 300000,
        netCashFlow: 200000,
        trend: [],
      },
    };
    render(<CashFlowWidget data={data} />);
    expect(screen.getByText("Inflows")).toBeInTheDocument();
    expect(screen.getByText("Outflows")).toBeInTheDocument();
    expect(screen.getByText("Net")).toBeInTheDocument();
  });

  it("shows period selector buttons", () => {
    const data = {
      mtd: { inflows: 100, outflows: 50, netCashFlow: 50, trend: [] },
    };
    render(<CashFlowWidget data={data} />);
    expect(screen.getByText("MTD")).toBeInTheDocument();
    expect(screen.getByText("QTD")).toBeInTheDocument();
    expect(screen.getByText("YTD")).toBeInTheDocument();
  });
});
