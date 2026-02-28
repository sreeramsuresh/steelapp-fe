/**
 * Login Component Tests
 * Phase 3C: Core auth component
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/login", search: "" }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
}));

// Mock auth service
const mockLogin = vi.fn();
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    login: (...args) => mockLogin(...args),
    passkeyLoginStart: vi.fn(),
    passkeyLoginFinish: vi.fn(),
  },
  tokenUtils: {
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setUser: vi.fn(),
  },
}));

// Mock TwoFactorVerification
vi.mock("../TwoFactorVerification", () => ({
  default: ({ onVerified, onCancel }) => (
    <div data-testid="two-factor-verification">
      <button type="button" onClick={() => onVerified({ user: { id: 1, name: "Test" } })}>
        Verify 2FA
      </button>
      <button type="button" onClick={onCancel}>
        Cancel 2FA
      </button>
    </div>
  ),
}));

// Mock import.meta.env
vi.stubEnv("PROD", false);
vi.stubEnv("VITE_AUTO_LOGIN", "false");

import Login from "../Login";

describe("Login", () => {
  let mockOnLoginSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess = vi.fn();
    mockLogin.mockReset();
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(container).toBeTruthy();
    });

    it("should display the company name heading", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(container.textContent).toContain("ULTIMATE STEELS");
    });

    it("should render email and password inputs", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it("should render sign in button", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(container.textContent).toContain("Sign In");
    });

    it("should render forgot password link", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const forgotLink = container.querySelector('a[href="/forgot-password"]');
      expect(forgotLink).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should update email field on input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');

      await user.type(emailInput, "test@example.com");
      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password field on input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector('input[name="password"]');

      await user.type(passwordInput, "password123");
      expect(passwordInput.value).toBe("password123");
    });

    it("should toggle password visibility", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector('input[name="password"]');

      expect(passwordInput.type).toBe("password");

      // Find and click the toggle button (eye icon button)
      const toggleButtons = container.querySelectorAll('button[type="button"]');
      const toggleBtn = Array.from(toggleButtons).find(
        (btn) => btn.closest(".relative") && btn.querySelector("svg")
      );
      if (toggleBtn) {
        await user.click(toggleBtn);
        expect(passwordInput.type).toBe("text");
      }
    });
  });

  describe("Form Submission", () => {
    it("should call authService.login on form submit", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should call onLoginSuccess after successful login", async () => {
      const user = setupUser();
      const mockUser = { id: 1, name: "Test User" };
      mockLogin.mockResolvedValue({ user: mockUser });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
      });
    });

    it("should display error on failed login", async () => {
      const user = setupUser();
      mockLogin.mockRejectedValue(new Error("Invalid credentials"));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "bad@example.com");
      await user.type(passwordInput, "wrong");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Invalid credentials");
      });
    });

    it("should handle account lockout", async () => {
      const user = setupUser();
      const lockoutError = new Error("Account locked");
      lockoutError.code = "ACCOUNT_LOCKED";
      lockoutError.remainingMinutes = 10;
      mockLogin.mockRejectedValue(lockoutError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "locked@example.com");
      await user.type(passwordInput, "test");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Account locked");
      });
    });
  });

  describe("2FA Flow", () => {
    it("should show 2FA verification when requires2FA is true", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({
        requires2FA: true,
        twoFactorToken: "token-123",
        methods: ["totp"],
      });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "pass");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.querySelector('[data-testid="two-factor-verification"]')).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading state during submission", async () => {
      const user = setupUser();
      let resolveLogin;
      mockLogin.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Please wait...");
      });

      resolveLogin({ user: { id: 1 } });
    });
  });
});
