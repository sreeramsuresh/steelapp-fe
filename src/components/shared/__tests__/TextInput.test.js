/**
 * TextInput Component Tests
 * Phase 5.3.2: Shared Component
 *
 * Tests text input with label, error, and required indicator (Bugs #8, #12)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TextInput from "../TextInput";
import sinon from 'sinon';

describe("TextInput", () => {
  let mockOnChange;

  beforeEach(() => {
    mockOnChange = sinon.stub();
    sinon.restore();
  });

  it("should render input with label", () => {
    render(<TextInput label="Email Address" value="" onChange={mockOnChange} />);

    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render without label when not provided", () => {
    render(<TextInput value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display required indicator when required is true", () => {
    render(<TextInput label="Username" value="" onChange={mockOnChange} required={true} />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should not display required indicator when required is false", () => {
    const { container: _container } = render(
      <TextInput label="Phone" value="" onChange={mockOnChange} required={false} />
    );

    const label = screen.getByLabelText("Phone");
    expect(label.textContent).not.toContain("*");
  });

  it("should call onChange when input changes", async () => {
    const user = userEvent.setup();
    render(<TextInput label="Email" value="" onChange={mockOnChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test@example.com");

    expect(mockOnChange).toHaveBeenCalledTimes(16); // Once for each character
  });

  it("should display error message when error is provided", () => {
    render(<TextInput label="Email" value="invalid" onChange={mockOnChange} error="Invalid email format" />);

    expect(screen.getByText("Invalid email format")).toBeInTheDocument();
  });

  it("should not display error message when error is not provided", () => {
    const { container: _container } = render(<TextInput label="Email" value="" onChange={mockOnChange} />);

    expect(container.textContent).not.toContain("Invalid");
  });

  it("should display help text when provided", () => {
    render(<TextInput label="Password" value="" onChange={mockOnChange} helpText="Minimum 8 characters required" />);

    expect(screen.getByText("Minimum 8 characters required")).toBeInTheDocument();
  });

  it("should not display help text when error is displayed", () => {
    const { container: _container } = render(
      <TextInput
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
    render(<TextInput type="email" label="Email" value="" onChange={mockOnChange} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("should handle different input types", () => {
    const { rerender } = render(<TextInput type="password" label="Password" value="" onChange={mockOnChange} />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");

    rerender(<TextInput type="number" label="Age" value="" onChange={mockOnChange} />);

    expect(screen.getByLabelText("Age")).toHaveAttribute("type", "number");
  });

  it("should disable input when disabled is true", () => {
    render(<TextInput label="Disabled Field" value="" onChange={mockOnChange} disabled={true} />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should display placeholder text", () => {
    render(<TextInput label="Email" value="" onChange={mockOnChange} placeholder="name@example.com" />);

    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
  });

  it("should display current value", () => {
    render(<TextInput label="Email" value="test@example.com" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container: _container } = render(
      <TextInput label="Email" value="" onChange={mockOnChange} className="custom-input" />
    );

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
    const { container: _container } = render(
      <TextInput label="Email" value="invalid" onChange={mockOnChange} error="Invalid email" />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("should apply correct styling when disabled", () => {
    const { container: _container } = render(
      <TextInput label="Email" value="" onChange={mockOnChange} disabled={true} />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("cursor-not-allowed");
  });

  it("should handle all input props through spread", async () => {
    const _user = userEvent.setup();
    render(<TextInput label="Email" value="" onChange={mockOnChange} maxLength="50" autoComplete="email" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toHaveAttribute("autoComplete", "email");
  });
});
