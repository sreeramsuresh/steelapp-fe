/**
 * FormField Component Tests
 * Phase 5.3.2: Shared Component
 *
 * Tests form field wrapper with label, helper text, and error display
 * Supports bugs #13 (clarity), #16 (placeholders), #21 (tooltips)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormField from "../FormField";

describe("FormField", () => {
  it("should render label with children", () => {
    render(
      <FormField label="Email Address" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );

    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display required indicator when required is true", () => {
    render(
      <FormField label="Username" htmlFor="username" required={true}>
        <input id="username" type="text" />
      </FormField>
    );

    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should not display required indicator when required is false", () => {
    const { container } = render(
      <FormField label="Phone Number" htmlFor="phone" required={false}>
        <input id="phone" type="tel" />
      </FormField>
    );

    const requiredMarks = container.querySelectorAll("span:contains('*')");
    expect(requiredMarks.length).toBe(0);
  });

  it("should display helper text", () => {
    render(
      <FormField label="Password" htmlFor="password" helperText="Minimum 8 characters">
        <input id="password" type="password" />
      </FormField>
    );

    expect(screen.getByText("Minimum 8 characters")).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email format">
        <input id="email" type="email" />
      </FormField>
    );

    expect(screen.getByText("Invalid email format")).toBeInTheDocument();
  });

  it("should display tooltip icon when tooltip is provided", () => {
    render(
      <FormField label="VAT Number" htmlFor="vat" tooltip="Enter UAE VAT Number">
        <input id="vat" type="text" />
      </FormField>
    );

    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });

  it("should have tooltip title attribute", () => {
    render(
      <FormField label="VAT Number" htmlFor="vat" tooltip="Enter UAE VAT Number">
        <input id="vat" type="text" />
      </FormField>
    );

    const tooltipIcon = screen.getByText("ℹ️");
    expect(tooltipIcon).toHaveAttribute("title", "Enter UAE VAT Number");
  });

  it("should not display tooltip when not provided", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );

    expect(screen.queryByText("ℹ️")).not.toBeInTheDocument();
  });

  it("should accept custom children elements", () => {
    render(
      <FormField label="Options" htmlFor="select">
        <select id="select">
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      </FormField>
    );

    expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
  });

  it("should display both helper text and error when both provided", () => {
    render(
      <FormField label="Email" htmlFor="email" helperText="Your contact email" error="Invalid format">
        <input id="email" type="email" />
      </FormField>
    );

    expect(screen.getByText("Your contact email")).toBeInTheDocument();
    expect(screen.getByText("Invalid format")).toBeInTheDocument();
  });

  it("should apply correct CSS classes for styling", () => {
    const { container } = render(
      <FormField label="Test" htmlFor="test">
        <input id="test" type="text" />
      </FormField>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-1");
  });

  it("should connect label to input via htmlFor", () => {
    render(
      <FormField label="Username" htmlFor="user-input">
        <input id="user-input" type="text" />
      </FormField>
    );

    const label = screen.getByText("Username").closest("label");
    expect(label).toHaveAttribute("for", "user-input");
  });

  it("should handle complex helper text with special characters", () => {
    render(
      <FormField label="Price" htmlFor="price" helperText="Price in AED (e.g., 1,000.50)">
        <input id="price" type="number" />
      </FormField>
    );

    expect(screen.getByText(/Price in AED/)).toBeInTheDocument();
  });

  it("should handle long error messages", () => {
    const longError =
      "This field is required and must contain at least 10 characters with at least one uppercase letter and one number.";

    render(
      <FormField label="Password" htmlFor="pwd" error={longError}>
        <input id="pwd" type="password" />
      </FormField>
    );

    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it("should render multiple children if provided as array", () => {
    render(
      <FormField label="Date Range" htmlFor="date-start">
        <input id="date-start" type="date" />
        <input id="date-end" type="date" />
      </FormField>
    );

    expect(screen.getByDisplayValue("")).toHaveCount(2);
  });

  it("should handle null/undefined values gracefully", () => {
    const { container } = render(
      <FormField label="Test" htmlFor="test" helperText={null} error={undefined}>
        <input id="test" type="text" />
      </FormField>
    );

    expect(container.textContent).toContain("Test");
  });
});
