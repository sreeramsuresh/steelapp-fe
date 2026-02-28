/**
 * ForgotPassword Component Tests
 * Phase 3C: Core auth component
 */

import { fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/forgot-password", search: "" }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock auth service
const mockForgotPassword = vi.fn();
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    forgotPassword: (...args) => mockForgotPassword(...args),
  },
}));

import ForgotPassword from "../ForgotPassword";

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotPassword.mockReset();
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      expect(container).toBeTruthy();
    });

    it("should display company name", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      expect(container.textContent).toContain("ULTIMATE STEELS");
    });

    it("should display reset password heading", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      expect(container.textContent).toContain("Reset your password");
    });

    it("should render email input", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toBeInTheDocument();
    });

    it("should render submit button", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      expect(container.textContent).toContain("Send Reset Link");
    });

    it("should render back to sign in link", () => {
      const { container } = renderWithProviders(<ForgotPassword />);
      const backLink = container.querySelector('a[href="/login"]');
      expect(backLink).toBeInTheDocument();
      expect(backLink.textContent).toContain("Back to Sign In");
    });
  });

  describe("Form Interactions", () => {
    it("should update email field on input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');

      await user.type(emailInput, "test@example.com");
      expect(emailInput.value).toBe("test@example.com");
    });
  });

  describe("Form Submission", () => {
    it("should call forgotPassword on form submit", async () => {
      const user = setupUser();
      mockForgotPassword.mockResolvedValue({});

      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith("test@example.com");
      });
    });

    it("should show success message after submission", async () => {
      const user = setupUser();
      mockForgotPassword.mockResolvedValue({});

      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Check your email");
        expect(container.textContent).toContain("test@example.com");
      });
    });

    it("should show error message on failure", async () => {
      const user = setupUser();
      mockForgotPassword.mockRejectedValue(new Error("Network error"));

      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Network error");
      });
    });

    it("should show loading state during submission", async () => {
      const user = setupUser();
      let resolveSubmit;
      mockForgotPassword.mockReturnValue(new Promise((resolve) => { resolveSubmit = resolve; }));

      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Sending...");
      });

      resolveSubmit({});
    });
  });

  describe("Success State", () => {
    it("should show back to sign in link after success", async () => {
      const user = setupUser();
      mockForgotPassword.mockResolvedValue({});

      const { container } = renderWithProviders(<ForgotPassword />);
      const emailInput = container.querySelector('input[type="email"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      await waitFor(() => {
        const backLink = container.querySelector('a[href="/login"]');
        expect(backLink).toBeInTheDocument();
        expect(backLink.textContent).toContain("Back to Sign In");
      });
    });
  });
});
