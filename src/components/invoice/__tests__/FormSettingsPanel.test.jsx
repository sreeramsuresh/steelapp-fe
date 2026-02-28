import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import FormSettingsPanel from "../FormSettingsPanel";
import { ThemeProvider } from "../../../contexts/ThemeContext";

vi.mock("../ToggleSwitchInvoice", () => ({
  default: ({ label, description }) => (
    <div data-testid="toggle">
      <span>{label}</span>
      <span>{description}</span>
    </div>
  ),
}));

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("FormSettingsPanel", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    preferences: { showValidationHighlighting: true },
    onPreferenceChange: vi.fn(),
  };

  it("returns null when not open", () => {
    const { container } = renderWithTheme(
      <FormSettingsPanel {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders header when open", () => {
    renderWithTheme(<FormSettingsPanel {...defaultProps} />);
    expect(screen.getByText("Form Settings")).toBeInTheDocument();
  });

  it("renders validation highlighting toggle", () => {
    renderWithTheme(<FormSettingsPanel {...defaultProps} />);
    expect(screen.getByText("Field Validation Highlighting")).toBeInTheDocument();
  });

  it("shows footer note", () => {
    renderWithTheme(<FormSettingsPanel {...defaultProps} />);
    expect(screen.getByText("Settings are saved automatically")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    renderWithTheme(<FormSettingsPanel {...defaultProps} />);
    // The close button is the X button in the header
    const buttons = screen.getAllByRole("button");
    buttons[0].click();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
