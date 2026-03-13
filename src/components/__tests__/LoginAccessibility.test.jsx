/**
 * Login Accessibility Tests
 * Tests WCAG-related concerns: labels, roles, keyboard nav, focus
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

describe("Login — Accessibility", () => {
  let mockOnLoginSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess = vi.fn();
    mockLogin.mockReset();
  });

  describe("Labels", () => {
    it("should have a label for the email input with matching htmlFor and id", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const emailId = emailInput.id;

      expect(emailId).toBeTruthy();

      const label = container.querySelector(`label[for="${emailId}"]`);
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("Email");
    });

    it("should have a label for the password input with matching htmlFor and id", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector('input[name="password"]');
      const passwordId = passwordInput.id;

      expect(passwordId).toBeTruthy();

      const label = container.querySelector(`label[for="${passwordId}"]`);
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("Password");
    });

    it("should have email-input as the email field id", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe("email");
    });

    it("should have password-input as the password field id", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector("#password-input");
      expect(passwordInput).toBeInTheDocument();
      // Initially password type
      expect(passwordInput.type).toBe("password");
    });
  });

  describe("Password Toggle Button", () => {
    it("should be a button element with type=button", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordWrapper = container.querySelector("#password-input").closest(".relative");
      const toggleBtn = passwordWrapper.querySelector('button[type="button"]');

      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn.tagName).toBe("BUTTON");
      expect(toggleBtn.type).toBe("button");
    });
  });

  describe("Submit Button", () => {
    it("should be keyboard accessible (is a button element)", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign In")
      );

      expect(submitBtn).toBeTruthy();
      expect(submitBtn.tagName).toBe("BUTTON");
    });

    it("should have type=submit or type=button for form submission", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign In")
      );

      // The Button component uses type="button" by default but Login overrides with type="submit"
      expect(["submit", "button"]).toContain(submitBtn.type);
    });
  });

  describe("Error Messages", () => {
    it("should display error text that is visible to screen readers", async () => {
      const user = setupUser();
      mockLogin.mockRejectedValue(new Error("Invalid credentials"));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrong");
      fireEvent.submit(form);

      await waitFor(() => {
        // Error should be rendered as visible text (not hidden)
        const errorText = container.textContent;
        expect(errorText).toContain("Invalid credentials");

        // Error element should exist in the DOM
        const errorEl = Array.from(container.querySelectorAll("span, div, p")).find((el) =>
          el.textContent.includes("Invalid credentials")
        );
        expect(errorEl).toBeTruthy();
      });
    });
  });

  describe("Focus Styles", () => {
    it("should have focus ring classes on email input", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      const classList = emailInput.className;

      // The component uses focus:ring-2 focus:ring-teal-500
      expect(classList).toContain("focus:ring-2");
      expect(classList).toContain("focus:ring-teal-500");
    });

    it("should have focus ring classes on password input", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const passwordInput = container.querySelector("#password-input");
      const classList = passwordInput.className;

      expect(classList).toContain("focus:ring-2");
      expect(classList).toContain("focus:ring-teal-500");
    });
  });

  describe("Loading State Accessibility", () => {
    it("should communicate loading state via button text change", async () => {
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
        // Button text changes to "Please wait..." during loading
        expect(container.textContent).toContain("Please wait...");
      });

      // The button should also be disabled
      const loadingBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Please wait...")
      );
      expect(loadingBtn.disabled).toBe(true);

      resolveLogin({ user: { id: 1 } });
    });
  });

  describe("Tab Order", () => {
    it("should have email, password, toggle, and submit in DOM order for natural tab flow", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      // Collect all focusable elements in the form area
      const form = container.querySelector("form");
      const focusable = form.querySelectorAll('input, button, a, [tabindex]:not([tabindex="-1"])');
      const focusableArray = Array.from(focusable);

      // Extract the key elements by identity
      const emailIdx = focusableArray.findIndex((el) => el.name === "email");
      const passwordIdx = focusableArray.findIndex((el) => el.name === "password");
      const toggleIdx = focusableArray.findIndex(
        (el) => el.type === "button" && el.closest(".relative") && el.querySelector("svg")
      );
      const submitIdx = focusableArray.findIndex((el) => el.textContent?.includes("Sign In"));

      // All should be found
      expect(emailIdx).toBeGreaterThanOrEqual(0);
      expect(passwordIdx).toBeGreaterThanOrEqual(0);
      expect(toggleIdx).toBeGreaterThanOrEqual(0);
      expect(submitIdx).toBeGreaterThanOrEqual(0);

      // Email before password
      expect(emailIdx).toBeLessThan(passwordIdx);
      // Password before toggle
      expect(passwordIdx).toBeLessThan(toggleIdx);
      // Toggle before submit
      expect(toggleIdx).toBeLessThan(submitIdx);
    });

    it("should have passkey button after submit in DOM order when supported", () => {
      window.PublicKeyCredential = { isConditionalMediationAvailable: vi.fn().mockResolvedValue(false) };

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const allButtons = Array.from(container.querySelectorAll("button"));
      const submitIdx = allButtons.findIndex((btn) => btn.textContent.includes("Sign In"));
      const passkeyIdx = allButtons.findIndex((btn) => btn.textContent.includes("Sign in with Passkey"));

      expect(submitIdx).toBeGreaterThanOrEqual(0);
      expect(passkeyIdx).toBeGreaterThanOrEqual(0);
      expect(submitIdx).toBeLessThan(passkeyIdx);

      // Cleanup
      delete window.PublicKeyCredential;
    });
  });

  describe("Input Attributes", () => {
    it("should have appropriate autocomplete attributes", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      const passwordInput = container.querySelector("#password-input");

      // Email field uses "username webauthn" for passkey conditional UI
      expect(emailInput.autocomplete).toContain("username");
      expect(passwordInput.autocomplete).toBe("current-password");
    });

    it("should have maxLength on email (254) and password (128) fields", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      const passwordInput = container.querySelector("#password-input");

      expect(emailInput.maxLength).toBe(254);
      expect(passwordInput.maxLength).toBe(128);
    });

    it("should have email type on email input", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      expect(emailInput.type).toBe("email");
    });

    it("should have placeholder text on both inputs", () => {
      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector("#email-input");
      const passwordInput = container.querySelector("#password-input");

      expect(emailInput.placeholder).toBeTruthy();
      expect(passwordInput.placeholder).toBeTruthy();
    });
  });
});
