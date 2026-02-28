import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import NewCustomerWidget from "../NewCustomerWidget";

describe("NewCustomerWidget", () => {
  it("renders without crashing", () => {
    render(<NewCustomerWidget />);
  });

  it("displays the widget title", () => {
    render(<NewCustomerWidget />);
    expect(screen.getAllByText("New Customers").length).toBeGreaterThan(0);
  });

  it("displays new customer count", () => {
    render(<NewCustomerWidget />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows retention rate", () => {
    render(<NewCustomerWidget />);
    expect(screen.getByText("Retention Rate")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows acquisition sources", () => {
    render(<NewCustomerWidget />);
    expect(screen.getByText("Acquisition Sources")).toBeInTheDocument();
    expect(screen.getByText("Referral")).toBeInTheDocument();
    expect(screen.getByText("Cold Outreach")).toBeInTheDocument();
  });

  it("shows recent acquisitions", () => {
    render(<NewCustomerWidget />);
    expect(screen.getByText("Recent Acquisitions")).toBeInTheDocument();
    expect(screen.getByText("Metro Steel Industries")).toBeInTheDocument();
  });

  it("shows view all button when onViewDetails is provided", () => {
    const onViewDetails = vi.fn();
    render(<NewCustomerWidget onViewDetails={onViewDetails} />);
    expect(screen.getByText("View All New Customers")).toBeInTheDocument();
  });
});
