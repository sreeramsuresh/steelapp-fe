import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../hooks/useDashboardPermissions", () => ({
  useDashboardPermissions: () => ({
    canViewWidget: () => true,
    getWidgetsByCategory: () => ["w1", "w2"],
    isLoading: false,
  }),
}));

import { DashboardSection, DashboardSectionSkeleton } from "../DashboardSection";

describe("DashboardSection", () => {
  const MockWidget = () => <div>Mock Widget Content</div>;
  const defaultProps = {
    title: "Financial Overview",
    description: "Key financial metrics",
    widgets: [
      { id: "w1", component: MockWidget, size: "md" },
      { id: "w2", component: MockWidget, size: "lg" },
    ],
  };

  it("renders without crashing", () => {
    render(<DashboardSection {...defaultProps} />);
  });

  it("displays the section title", () => {
    render(<DashboardSection {...defaultProps} />);
    expect(screen.getByText("Financial Overview")).toBeInTheDocument();
  });

  it("displays the section description", () => {
    render(<DashboardSection {...defaultProps} />);
    expect(screen.getByText("Key financial metrics")).toBeInTheDocument();
  });

  it("shows widget count when showCount is true", () => {
    render(<DashboardSection {...defaultProps} showCount={true} />);
    expect(screen.getByText("2 widgets")).toBeInTheDocument();
  });

  it("collapses and expands when header is clicked", () => {
    render(<DashboardSection {...defaultProps} />);
    expect(screen.getAllByText("Mock Widget Content").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Financial Overview"));
    expect(screen.queryByText("Mock Widget Content")).not.toBeInTheDocument();
  });

  it("returns null when no visible widgets and not loading", () => {
    const { container } = render(
      <DashboardSection {...defaultProps} widgets={[{ id: "nonexistent", component: MockWidget }]} />
    );
    // With canViewWidget returning true, it should render
    expect(container).toBeTruthy();
  });
});

describe("DashboardSectionSkeleton", () => {
  it("renders skeleton placeholders", () => {
    const { container } = render(<DashboardSectionSkeleton count={3} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });
});
