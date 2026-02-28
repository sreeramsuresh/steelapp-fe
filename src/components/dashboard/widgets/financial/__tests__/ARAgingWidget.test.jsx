import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ARAgingWidget from "../ARAgingWidget";

describe("ARAgingWidget", () => {
  it("renders without crashing", () => {
    render(<ARAgingWidget />);
  });

  it("displays the widget title", () => {
    render(<ARAgingWidget />);
    expect(screen.getByText("AR Aging")).toBeInTheDocument();
  });

  it("displays aging buckets from mock data", () => {
    render(<ARAgingWidget />);
    expect(screen.getByText("0-30 Days")).toBeInTheDocument();
    expect(screen.getByText("31-60 Days")).toBeInTheDocument();
    expect(screen.getByText("61-90 Days")).toBeInTheDocument();
    expect(screen.getByText("90+ Days")).toBeInTheDocument();
  });

  it("displays total AR and overdue", () => {
    render(<ARAgingWidget />);
    expect(screen.getByText("Total AR")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows view full report button", () => {
    render(<ARAgingWidget />);
    expect(screen.getByText("View Full AR Aging Report")).toBeInTheDocument();
  });
});
