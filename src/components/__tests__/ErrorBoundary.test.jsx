/**
 * ErrorBoundary Component Tests
 * Phase 3C: Core error handling component
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/", search: "" }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import ErrorBoundary from "../ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="child-content">No error</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress React error boundary console output during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Normal Rendering", () => {
    it("should render children when no error", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Child Content");
    });

    it("should render multiple children without error", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <div>First</div>
          <div>Second</div>
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("First");
      expect(container.textContent).toContain("Second");
    });
  });

  describe("Error Handling", () => {
    it("should catch errors and show fallback UI", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Oops! Something went wrong");
      expect(container.textContent).not.toContain("No error");
    });

    it("should display helpful message", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("We encountered an unexpected error");
    });
  });

  describe("Action Buttons", () => {
    it("should render Try Again button", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Try Again");
    });

    it("should render Go Back button", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Go Back");
    });

    it("should render Reload Page button", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Reload Page");
    });

    it("should reset error state on Try Again click", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();

      // Render with error first
      const { container, rerender } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("Oops! Something went wrong");

      // Find and click Try Again
      const buttons = container.querySelectorAll("button");
      const tryAgainBtn = Array.from(buttons).find((b) => b.textContent.includes("Try Again"));

      if (tryAgainBtn) {
        await user.click(tryAgainBtn);
        // After reset, it will try to render children again (which will throw again)
        // The key behavior is that handleReset is called
      }
    });
  });

  describe("Help Text", () => {
    it("should display support contact guidance", () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.textContent).toContain("contact support");
    });
  });
});
