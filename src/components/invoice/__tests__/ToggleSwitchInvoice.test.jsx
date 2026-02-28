import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ToggleSwitchInvoice from "../ToggleSwitchInvoice";

describe("ToggleSwitchInvoice", () => {
  const defaultProps = {
    enabled: false,
    onChange: vi.fn(),
    label: "Test Toggle",
    description: "Toggle description text",
    isDarkMode: false,
  };

  it("renders label text", () => {
    render(<ToggleSwitchInvoice {...defaultProps} />);
    expect(screen.getByText("Test Toggle")).toBeTruthy();
  });

  it("renders description text", () => {
    render(<ToggleSwitchInvoice {...defaultProps} />);
    expect(screen.getByText("Toggle description text")).toBeTruthy();
  });

  it("renders toggle button", () => {
    render(<ToggleSwitchInvoice {...defaultProps} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("calls onChange when toggle is clicked", () => {
    render(<ToggleSwitchInvoice {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
  });

  it("applies enabled styles when enabled is true", () => {
    render(<ToggleSwitchInvoice {...defaultProps} enabled={true} />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-teal-600");
  });

  it("applies disabled styles when enabled is false", () => {
    render(<ToggleSwitchInvoice {...defaultProps} enabled={false} />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-gray-200");
  });

  it("applies dark mode styles when isDarkMode is true and disabled", () => {
    render(<ToggleSwitchInvoice {...defaultProps} isDarkMode={true} enabled={false} />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-gray-600");
  });
});
