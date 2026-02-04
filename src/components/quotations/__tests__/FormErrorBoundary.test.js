/**
 * FormErrorBoundary Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests error boundary for form components (Bug #59 fix)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FormErrorBoundary from "../FormErrorBoundary";

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Component that throws an error
const BrokenComponent = () => {
  throw new Error("Intentional test error");
};

// Component that renders normally
const WorkingComponent = () => {
  return <div>Component rendered successfully</div>;
};

describe("FormErrorBoundary (Class Component)", () => {
  it("should render children when no error occurs", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <WorkingComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Component rendered successfully")).toBeInTheDocument();
  });

  it("should catch errors and display error UI", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Test Form Error")).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it("should display form name in error message", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Quotation Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Quotation Form Error")).toBeInTheDocument();
  });

  it("should display default form name when none provided", () => {
    render(
      <FormErrorBoundary isDarkMode={false}>
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Form Error")).toBeInTheDocument();
  });

  it("should display error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText(/Intentional test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should provide Try Again button to retry", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Test Form Error")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /Try Again/ });
    await user.click(retryButton);

    // After clicking retry, component should attempt to render again
    // (In this case it will still error, but the boundary was reset)
  });

  it("should provide Go Home button to navigate away", async () => {
    const user = userEvent.setup();
    const originalLocation = window.location.href;
    delete window.location;
    window.location = { href: originalLocation };

    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    const goHomeButton = screen.getByRole("button", { name: /Go Home/ });
    await user.click(goHomeButton);

    // Go Home button should navigate to home
    expect(window.location.href).toBe("/");

    window.location.href = originalLocation;
  });

  it("should display support message", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText(/contact support or refresh/)).toBeInTheDocument();
  });

  it("should log error to console", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should apply dark mode styles when isDarkMode is true", () => {
    const { container } = render(
      <FormErrorBoundary isDarkMode={true} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    const errorContainer = container.querySelector('[class*="bg-gray-900"]');
    expect(errorContainer).toBeInTheDocument();
  });

  it("should apply light mode styles when isDarkMode is false", () => {
    const { container } = render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <BrokenComponent />
      </FormErrorBoundary>
    );

    const errorContainer = container.querySelector('[class*="bg-gray-50"]');
    expect(errorContainer).toBeInTheDocument();
  });

  it("should handle nested error boundaries", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Outer Form">
        <FormErrorBoundary isDarkMode={false} formName="Inner Form">
          <BrokenComponent />
        </FormErrorBoundary>
      </FormErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(screen.getByText("Inner Form Error")).toBeInTheDocument();
  });

  it("should render working component after error catch and retry", async () => {
    const user = userEvent.setup();
    let shouldError = true;

    const ConditionalComponent = () => {
      if (shouldError) {
        throw new Error("Conditional error");
      }
      return <div>Now working</div>;
    };

    const { rerender } = render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <ConditionalComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();

    // Set component to not error
    shouldError = false;

    // Find and click retry button
    const retryButton = screen.getByRole("button", { name: /Try Again/ });
    await user.click(retryButton);

    // Rerender with updated condition
    rerender(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <ConditionalComponent />
      </FormErrorBoundary>
    );

    // Component should now render successfully
    expect(screen.getByText("Now working")).toBeInTheDocument();
  });

  it("should not render error UI for warnings or non-fatal issues", () => {
    render(
      <FormErrorBoundary isDarkMode={false} formName="Test Form">
        <WorkingComponent />
      </FormErrorBoundary>
    );

    expect(screen.queryByText(/An unexpected error occurred/)).not.toBeInTheDocument();
  });
});

describe("FormErrorBoundaryWithTheme Wrapper", () => {
  it("should exist as a named export", () => {
    const { FormErrorBoundaryWithTheme } = require("../FormErrorBoundary");
    expect(FormErrorBoundaryWithTheme).toBeDefined();
  });
});
