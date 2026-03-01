/**
 * TextInput Component Tests
 * Phase 5.3.2: Shared Component
 *
 * Tests text input with label, error, and required indicator (Bugs #8, #12)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TextInput from "../TextInput";

describe("TextInput", () => {
  let mockOnChange;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.restoreAllMocks();
  });

  it("should render input with label", () => {
    render(<TextInput id="email" label="Email Address" value="" onChange={mockOnChange} />);

    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render without label when not provided", () => {
    render(<TextInput value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display required indicator when required is true", () => {
    render(<TextInput id="username" label="Username" value="" onChange={mockOnChange} required={true} />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should not display required indicator when required is false", () => {
    render(<TextInput id="phone" label="Phone" value="" onChange={mockOnChange} required={false} />);

    // No asterisk should be present
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should call onChange when input changes", async () => {
    const user = userEvent.setup();
    render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test@example.com");

    expect(mockOnChange).toHaveBeenCalledTimes(16); // Once for each character
  });

  it("should display error message when error is provided", () => {
    render(<TextInput id="email" label="Email" value="invalid" onChange={mockOnChange} error="Invalid email format" />);

    expect(screen.getByText("Invalid email format")).toBeInTheDocument();
  });

  it("should not display error message when error is not provided", () => {
    const { container } = render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} />);

    expect(container.textContent).not.toContain("Invalid");
  });

  it("should display help text when provided", () => {
    render(
      <TextInput
        id="password"
        label="Password"
        value=""
        onChange={mockOnChange}
        helpText="Minimum 8 characters required"
      />
    );

    expect(screen.getByText("Minimum 8 characters required")).toBeInTheDocument();
  });

  it("should not display help text when error is displayed", () => {
    const { container } = render(
      <TextInput
        id="email"
        label="Email"
        value="invalid"
        onChange={mockOnChange}
        helpText="Enter valid email"
        error="Invalid format"
      />
    );

    expect(container.textContent).not.toContain("Enter valid email");
  });

  it("should apply correct type attribute", () => {
    render(<TextInput id="email" type="email" label="Email" value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("should handle different input types", () => {
    const { rerender } = render(
      <TextInput type="password" id="password-field" label="Password" value="" onChange={mockOnChange} />
    );

    const passwordInput = document.getElementById("password-field");
    expect(passwordInput).toHaveAttribute("type", "password");

    rerender(<TextInput type="number" id="age-field" label="Age" value="" onChange={mockOnChange} />);

    const ageInput = document.getElementById("age-field");
    expect(ageInput).toHaveAttribute("type", "number");
  });

  it("should disable input when disabled is true", () => {
    render(<TextInput id="disabled" label="Disabled Field" value="" onChange={mockOnChange} disabled={true} />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should display placeholder text", () => {
    render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} placeholder="name@example.com" />);

    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
  });

  it("should display current value", () => {
    render(<TextInput id="email" label="Email" value="test@example.com" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} className="custom-input" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-input");
  });

  it("should use id when provided", () => {
    render(<TextInput id="email-field" label="Email" value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("id", "email-field");
  });

  it("should use name when id is not provided", () => {
    render(<TextInput name="email-name" label="Email" value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "email-name");
  });

  it("should apply error styling when error is present", () => {
    render(<TextInput id="email" label="Email" value="invalid" onChange={mockOnChange} error="Invalid email" />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("should apply correct styling when disabled", () => {
    render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} disabled={true} />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("cursor-not-allowed");
  });

  it("should handle all input props through spread", async () => {
    render(<TextInput id="email" label="Email" value="" onChange={mockOnChange} maxLength="50" autoComplete="email" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toHaveAttribute("autoComplete", "email");
  });
});
