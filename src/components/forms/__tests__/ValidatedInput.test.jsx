import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

import ValidatedInput from "../ValidatedInput";

describe("ValidatedInput", () => {
  it("renders without crashing", () => {
    const { container } = render(<ValidatedInput />);
    expect(container).toBeTruthy();
  });

  it("renders with label", () => {
    render(<ValidatedInput label="Product Name" />);
    expect(screen.getByText("Product Name")).toBeInTheDocument();
  });

  it("shows error message when error prop is set", () => {
    render(<ValidatedInput label="Price" error="Price is required" />);
    expect(screen.getByText("Price is required")).toBeInTheDocument();
  });

  it("applies valid validation class", () => {
    const { container } = render(
      <ValidatedInput label="Name" validationState="valid" showValidation={true} />
    );
    const input = container.querySelector("input");
    expect(input.className).toContain("border-green-500");
  });

  it("applies invalid validation class", () => {
    const { container } = render(
      <ValidatedInput label="Name" validationState="invalid" showValidation={true} />
    );
    const input = container.querySelector("input");
    expect(input.className).toContain("border-red-500");
  });
});
