import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ERPListPageLayout from "../ERPListPageLayout";

describe("ERPListPageLayout", () => {
  it("renders title and subtitle", () => {
    render(
      <ERPListPageLayout
        icon={<span>IC</span>}
        title="Invoices"
        subtitle="Manage customer invoices"
      >
        <div>Table content</div>
      </ERPListPageLayout>
    );
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.getByText("Manage customer invoices")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(
      <ERPListPageLayout icon={<span data-testid="icon">IC</span>} title="Test" subtitle="Sub">
        <div>Content</div>
      </ERPListPageLayout>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <ERPListPageLayout icon={<span>IC</span>} title="Test" subtitle="Sub">
        <div>My table here</div>
      </ERPListPageLayout>
    );
    expect(screen.getByText("My table here")).toBeInTheDocument();
  });

  it("renders action buttons when provided", () => {
    render(
      <ERPListPageLayout
        icon={<span>IC</span>}
        title="POs"
        subtitle="Purchase Orders"
        actions={<button type="button">Create New</button>}
      >
        <div>Table</div>
      </ERPListPageLayout>
    );
    expect(screen.getByText("Create New")).toBeInTheDocument();
  });

  it("does not render actions section when not provided", () => {
    const { container } = render(
      <ERPListPageLayout icon={<span>IC</span>} title="Test" subtitle="Sub">
        <div>Content</div>
      </ERPListPageLayout>
    );
    // The actions wrapper should not exist
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(0);
  });
});
