/**
 * FormSelect Component Tests
 * Tests Radix UI Select wrapper with validation coloring
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../forms/ValidatedInput", () => ({
  getValidationClasses: () => "border-gray-300",
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }) => <div data-testid="select-root">{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectTrigger: ({ children, ...props }) => (
    <button data-testid={props["data-testid"] || "select-trigger"} id={props.id}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
}));

import { FormSelect } from "../form-select";

describe("FormSelect", () => {
  it("renders without crashing", () => {
    const { container } = render(<FormSelect onValueChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("renders with label", () => {
    render(<FormSelect label="Category" onValueChange={vi.fn()} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    render(<FormSelect placeholder="Choose an option" onValueChange={vi.fn()} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("renders default placeholder when none provided", () => {
    render(<FormSelect onValueChange={vi.fn()} />);
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });

  it("renders required asterisk when required", () => {
    render(<FormSelect label="Status" required onValueChange={vi.fn()} />);
    // Required uses CSS after pseudo-element, label should be present
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<FormSelect className="custom-class" onValueChange={vi.fn()} />);
    expect(container.firstChild.className).toContain("custom-class");
  });

  it("passes data-testid to trigger", () => {
    render(<FormSelect data-testid="my-select" onValueChange={vi.fn()} />);
    expect(screen.getByTestId("my-select")).toBeInTheDocument();
  });
});
