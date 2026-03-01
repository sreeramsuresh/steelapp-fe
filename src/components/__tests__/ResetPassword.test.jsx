/**
 * ResetPassword Component Tests
 * Phase 3C: Core auth component
 */

import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams("?token=valid-token-123");

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/reset-password", search: "?token=valid-token-123" }),
  useParams: () => ({}),
  useSearchParams: () => [mockSearchParams],
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock auth service
const mockResetPassword = vi.fn();
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    resetPassword: (...args) => mockResetPassword(...args),
  },
}));

import ResetPassword from "../ResetPassword";

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPassword.mockReset();
    mockSearchParams = new URLSearchParams("?token=valid-token-123");
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      expect(container).toBeTruthy();
    });

    it("should display company name", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      expect(container.textContent).toContain("ULTIMATE STEELS");
    });

    it("should display create new password heading", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      expect(container.textContent).toContain("Create a new password");
    });

    it("should render password inputs", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      expect(passwordInput).toBeInTheDocument();
      expect(confirmInput).toBeInTheDocument();
    });

    it("should render Reset Password button", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      expect(container.textContent).toContain("Reset Password");
    });

    it("should render back to sign in link", () => {
      const { container } = renderWithProviders(<ResetPassword />);
      const backLink = container.querySelector('a[href="/login"]');
      expect(backLink).toBeInTheDocument();
    });
  });

  describe("Missing Token", () => {
    it("should show error when no token is provided", () => {
      mockSearchParams = new URLSearchParams("");

      const { container } = renderWithProviders(<ResetPassword />);
      expect(container.textContent).toContain("Invalid reset link");
    });

    it("should show request new link option when token is missing", () => {
      mockSearchParams = new URLSearchParams("");

      const { container } = renderWithProviders(<ResetPassword />);
      const newLinkLink = container.querySelector('a[href="/forgot-password"]');
      expect(newLinkLink).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error for short password", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "short");
      await user.type(confirmInput, "short");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Password must be at least 8 characters");
      });
    });

    it("should show error for mismatched passwords", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "password123");
      await user.type(confirmInput, "password456");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Passwords do not match");
      });
    });
  });

  describe("Form Submission", () => {
    it("should call resetPassword on valid submit", async () => {
      const user = setupUser();
      mockResetPassword.mockResolvedValue({});

      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith("valid-token-123", "newpassword123");
      });
    });

    it("should show success message after reset", async () => {
      const user = setupUser();
      mockResetPassword.mockResolvedValue({});

      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("password has been reset successfully");
      });
    });

    it("should show error message on failed reset", async () => {
      const user = setupUser();
      mockResetPassword.mockRejectedValue(new Error("Token expired"));

      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Token expired");
      });
    });

    it("should show loading state during submission", async () => {
      const user = setupUser();
      let resolveReset;
      mockResetPassword.mockReturnValue(
        new Promise((resolve) => {
          resolveReset = resolve;
        })
      );

      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Resetting...");
      });

      resolveReset({});
    });
  });

  describe("Error Recovery", () => {
    it("should show request new link when reset fails", async () => {
      const user = setupUser();
      mockResetPassword.mockRejectedValue(new Error("Token expired"));

      const { container } = renderWithProviders(<ResetPassword />);
      const passwordInput = container.querySelector("#new-password");
      const confirmInput = container.querySelector("#confirm-password");
      const form = container.querySelector("form");

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmInput, "newpassword123");
      fireEvent.submit(form);

      await waitFor(() => {
        const newLinkLink = container.querySelector('a[href="/forgot-password"]');
        expect(newLinkLink).toBeInTheDocument();
      });
    });
  });
});
