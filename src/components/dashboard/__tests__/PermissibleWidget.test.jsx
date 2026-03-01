import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PermissibleWidget, withWidgetPermission } from "../PermissibleWidget";

vi.mock("../../../hooks/useDashboardPermissions", () => ({
  useDashboardPermissions: vi.fn(),
}));

import { useDashboardPermissions } from "../../../hooks/useDashboardPermissions";

describe("PermissibleWidget", () => {
  it("renders children when widget is permitted", () => {
    useDashboardPermissions.mockReturnValue({
      canViewWidget: () => true,
      isLoading: false,
    });
    render(
      <PermissibleWidget widgetId="revenue">
        <div>Revenue Chart</div>
      </PermissibleWidget>
    );
    expect(screen.getByText("Revenue Chart")).toBeInTheDocument();
  });

  it("renders fallback when widget is not permitted", () => {
    useDashboardPermissions.mockReturnValue({
      canViewWidget: () => false,
      isLoading: false,
    });
    render(
      <PermissibleWidget widgetId="revenue" fallback={<div>No access</div>}>
        <div>Revenue Chart</div>
      </PermissibleWidget>
    );
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("Revenue Chart")).not.toBeInTheDocument();
  });

  it("returns null while loading", () => {
    useDashboardPermissions.mockReturnValue({
      canViewWidget: () => true,
      isLoading: true,
    });
    const { container } = render(
      <PermissibleWidget widgetId="revenue">
        <div>Content</div>
      </PermissibleWidget>
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("withWidgetPermission", () => {
  it("wraps component with permission check", () => {
    useDashboardPermissions.mockReturnValue({
      canViewWidget: () => true,
      isLoading: false,
    });
    const Inner = () => <div>Inner</div>;
    const Wrapped = withWidgetPermission(Inner, "test-widget");
    render(<Wrapped />);
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });

  it("hides component when not permitted", () => {
    useDashboardPermissions.mockReturnValue({
      canViewWidget: () => false,
      isLoading: false,
    });
    const Inner = () => <div>Inner</div>;
    const Wrapped = withWidgetPermission(Inner, "test-widget");
    const { container } = render(<Wrapped />);
    expect(container.innerHTML).toBe("");
  });
});
