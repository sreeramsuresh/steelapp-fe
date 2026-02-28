import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: (props) => <svg data-testid="arrow-left" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
}));

import ERPFormLayout, { FormDrawer, FormDesignTokens } from "../ERPFormLayout";

describe("ERPFormLayout", () => {
  it("renders title and children", () => {
    render(
      <ERPFormLayout title="Create Invoice" onBack={() => {}}>
        <div>Form content</div>
      </ERPFormLayout>
    );
    expect(screen.getByText("Create Invoice")).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <ERPFormLayout title="Edit PO" subtitle="PO-2025-001" onBack={() => {}}>
        <div>Content</div>
      </ERPFormLayout>
    );
    expect(screen.getByText("PO-2025-001")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(
      <ERPFormLayout title="Test" onBack={onBack}>
        <div>Content</div>
      </ERPFormLayout>
    );
    fireEvent.click(screen.getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders status badge and header actions", () => {
    render(
      <ERPFormLayout
        title="Invoice"
        onBack={() => {}}
        statusBadge={<span>Draft</span>}
        headerActions={<button type="button">Save</button>}
      >
        <div>Content</div>
      </ERPFormLayout>
    );
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders aside sidebar when provided", () => {
    render(
      <ERPFormLayout
        title="Form"
        onBack={() => {}}
        aside={<div>Sidebar content</div>}
      >
        <div>Main content</div>
      </ERPFormLayout>
    );
    expect(screen.getByText("Sidebar content")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("applies custom testId", () => {
    render(
      <ERPFormLayout title="Test" onBack={() => {}} testId="my-form">
        <div>Content</div>
      </ERPFormLayout>
    );
    expect(screen.getByTestId("my-form")).toBeInTheDocument();
  });
});

describe("FormDrawer", () => {
  it("returns null when not open", () => {
    const { container } = render(
      <FormDrawer open={false} onClose={() => {}} title="Drawer">
        <div>Drawer content</div>
      </FormDrawer>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders title and children when open", () => {
    render(
      <FormDrawer open={true} onClose={() => {}} title="Item Details">
        <div>Detail content</div>
      </FormDrawer>
    );
    expect(screen.getByText("Item Details")).toBeInTheDocument();
    expect(screen.getByText("Detail content")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <FormDrawer open={true} onClose={() => {}} title="Edit" subtitle="Line 1">
        <div>Content</div>
      </FormDrawer>
    );
    expect(screen.getByText("Line 1")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <FormDrawer
        open={true}
        onClose={() => {}}
        title="Drawer"
        footer={<button type="button">Save</button>}
      >
        <div>Content</div>
      </FormDrawer>
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <FormDrawer open={true} onClose={onClose} title="Drawer">
        <div>Content</div>
      </FormDrawer>
    );
    fireEvent.click(screen.getByLabelText("Close drawer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("FormDesignTokens", () => {
  it("returns string tokens for light mode", () => {
    expect(FormDesignTokens.card(false)).toContain("bg-white");
    expect(FormDesignTokens.input(false)).toContain("bg-white");
    expect(FormDesignTokens.label(false)).toContain("text-gray-500");
  });

  it("returns string tokens for dark mode", () => {
    expect(FormDesignTokens.card(true)).toContain("bg-gray-800");
    expect(FormDesignTokens.input(true)).toContain("bg-gray-900");
    expect(FormDesignTokens.label(true)).toContain("text-gray-400");
  });

  it("has buttonPrimary as a static string", () => {
    expect(FormDesignTokens.buttonPrimary).toContain("bg-teal-600");
  });
});
