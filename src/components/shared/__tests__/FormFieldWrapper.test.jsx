/**
 * FormFieldWrapper Component Tests
 * Tests wrapper with label, error, required indicator, and help text
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormFieldWrapper from "../FormFieldWrapper";

describe("FormFieldWrapper", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <FormFieldWrapper>
        <input type="text" />
      </FormFieldWrapper>
    );
    expect(container).toBeTruthy();
  });

  it("renders children", () => {
    render(
      <FormFieldWrapper>
        <input type="text" data-testid="child-input" />
      </FormFieldWrapper>
    );
    expect(screen.getByTestId("child-input")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(
      <FormFieldWrapper label="Email" id="email">
        <input id="email" type="email" />
      </FormFieldWrapper>
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders required indicator when required", () => {
    render(
      <FormFieldWrapper label="Name" required>
        <input type="text" />
      </FormFieldWrapper>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render required indicator when not required", () => {
    render(
      <FormFieldWrapper label="Notes">
        <textarea />
      </FormFieldWrapper>
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders error message when error is provided", () => {
    render(
      <FormFieldWrapper label="Field" error="This field is required">
        <input type="text" />
      </FormFieldWrapper>
    );
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("renders help text when provided and no error", () => {
    render(
      <FormFieldWrapper label="Field" helpText="Enter your value">
        <input type="text" />
      </FormFieldWrapper>
    );
    expect(screen.getByText("Enter your value")).toBeInTheDocument();
  });

  it("does not render help text when error is present", () => {
    render(
      <FormFieldWrapper label="Field" helpText="Help" error="Error">
        <input type="text" />
      </FormFieldWrapper>
    );
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
