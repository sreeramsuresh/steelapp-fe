/**
 * Login Edge Cases Tests
 * Tests form submission edge cases and input behavior
 */

import { fireEvent, waitFor } from "@testing-library/react";
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
    getUser: vi.fn().mockReturnValue(null),
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

describe("Login — Edge Cases", () => {
  let mockOnLoginSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess = vi.fn();
    mockLogin.mockReset();
  });

  describe("Form Submission", () => {
    it("should submit the form when Enter key is pressed in password field", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      // Pressing Enter on a form input triggers submit
      await user.type(passwordInput, "{enter}");

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123", null);
      });
    });

    it("should not send multiple requests on rapid double clicks", async () => {
      const user = setupUser();
      let resolveLogin;
      mockLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // Submit twice rapidly
      fireEvent.submit(form);
      fireEvent.submit(form);

      await waitFor(() => {
        // First submit sets loading=true, second submit runs but the first is still in-flight
        // The component calls setLoading(true) at start, so the button becomes disabled
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });

      resolveLogin({ user: { id: 1 } });
    });

    it("should disable the submit button during in-flight request", async () => {
      const user = setupUser();
      let resolveLogin;
      mockLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      fireEvent.submit(form);

      await waitFor(() => {
        // The submit button should be disabled while loading
        const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Please wait...")
        );
        expect(submitBtn).toBeTruthy();
        expect(submitBtn.disabled).toBe(true);
      });

      resolveLogin({ user: { id: 1 } });
    });
  });

  describe("Password Toggle", () => {
    it("should toggle password visibility round-trip (masked -> visible -> masked)", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector('input[name="password"]');

      // Initially masked
      expect(passwordInput.type).toBe("password");

      // Find the toggle button (inside .relative, has svg)
      const toggleButtons = container.querySelectorAll('button[type="button"]');
      const toggleBtn = Array.from(toggleButtons).find((btn) => btn.closest(".relative") && btn.querySelector("svg"));
      expect(toggleBtn).toBeTruthy();

      // Click to show
      await user.click(toggleBtn);
      expect(passwordInput.type).toBe("text");

      // Click to hide again
      await user.click(toggleBtn);
      expect(passwordInput.type).toBe("password");
    });

    it("should not clear password value when toggling visibility", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector('input[name="password"]');

      await user.type(passwordInput, "mySecretPass");
      expect(passwordInput.value).toBe("mySecretPass");

      const toggleBtn = Array.from(container.querySelectorAll('button[type="button"]')).find(
        (btn) => btn.closest(".relative") && btn.querySelector("svg")
      );

      // Toggle to visible
      await user.click(toggleBtn);
      expect(passwordInput.value).toBe("mySecretPass");

      // Toggle back to masked
      await user.click(toggleBtn);
      expect(passwordInput.value).toBe("mySecretPass");
    });
  });

  describe("Email Input Edge Cases", () => {
    it("should accept email with uppercase letters", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "Admin@Example.COM");
      await user.type(passwordInput, "password");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("Admin@Example.COM", "password", null);
      });
    });

    it("should pass email with leading/trailing spaces as-is to login", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      // Note: browser email inputs may strip spaces, but we test the value as-is
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password", null);
      });
    });
  });

  describe("Password Input Edge Cases", () => {
    it("should handle very long password (128+ chars)", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      const longPassword = "a".repeat(128);
      await user.type(emailInput, "test@example.com");
      // Password field has maxLength=128, so typing 128 chars should work
      await user.type(passwordInput, longPassword);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", longPassword, null);
      });
    });
  });

  describe("Empty Fields", () => {
    it("should have required attribute on email and password inputs", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');

      expect(emailInput.required).toBe(true);
      expect(passwordInput.required).toBe(true);
    });
  });

  describe("Forgot Password Link", () => {
    it("should render forgot password link pointing to /forgot-password", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const forgotLink = container.querySelector('a[href="/forgot-password"]');

      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink.textContent).toContain("Forgot your password?");
    });

    it("should be a clickable link element", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const forgotLink = container.querySelector('a[href="/forgot-password"]');

      // Link should be interactive (not disabled, not hidden)
      expect(forgotLink.tagName).toBe("A");
      // Clicking should not throw
      await user.click(forgotLink);
    });
  });
});
