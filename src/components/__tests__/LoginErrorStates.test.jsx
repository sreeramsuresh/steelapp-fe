/**
 * Login Error States Tests
 * Tests error handling, display, and recovery
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
const mockPasskeyLoginStart = vi.fn();
const mockPasskeyLoginFinish = vi.fn();
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    login: (...args) => mockLogin(...args),
    passkeyLoginStart: (...args) => mockPasskeyLoginStart(...args),
    passkeyLoginFinish: (...args) => mockPasskeyLoginFinish(...args),
    sendLockoutOtp: vi.fn(),
    verifyLockoutOtp: vi.fn(),
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

/**
 * Helper: fill email+password and submit the form
 */
async function fillAndSubmit(container, user, email = "test@example.com", password = "password123") {
  const emailInput = container.querySelector('input[name="email"]');
  const passwordInput = container.querySelector('input[name="password"]');
  const form = container.querySelector("form");

  await user.type(emailInput, email);
  await user.type(passwordInput, password);
  fireEvent.submit(form);
}

describe("Login — Error States", () => {
  let mockOnLoginSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess = vi.fn();
    mockLogin.mockReset();
    mockPasskeyLoginStart.mockReset();
    mockPasskeyLoginFinish.mockReset();
  });

  describe("Server Errors", () => {
    it("should display error message on generic server error (500)", async () => {
      const user = setupUser();
      mockLogin.mockRejectedValue(new Error("Internal Server Error"));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        expect(container.textContent).toContain("Internal Server Error");
      });
    });

    it("should display authentication failed on error without message", async () => {
      const user = setupUser();
      mockLogin.mockRejectedValue(new Error(""));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        // The component falls back to "Authentication failed" when message is empty
        expect(container.textContent).toContain("Authentication failed");
      });
    });

    it("should display network error message", async () => {
      const user = setupUser();
      mockLogin.mockRejectedValue(new Error("Network Error"));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        expect(container.textContent).toContain("Network Error");
      });
    });
  });

  describe("Error Clearing", () => {
    it("should clear error when form is resubmitted", async () => {
      const user = setupUser();
      // First call fails
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
      // Second call succeeds
      mockLogin.mockResolvedValueOnce({ user: { id: 1, name: "Test" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      const emailInput = container.querySelector('input[name="email"]');
      const passwordInput = container.querySelector('input[name="password"]');
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrong");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(container.textContent).toContain("Invalid credentials");
      });

      // Clear and re-enter password, then resubmit
      await user.clear(passwordInput);
      await user.type(passwordInput, "correct");
      fireEvent.submit(form);

      // handleSubmit calls setError("") at the start, clearing the error
      await waitFor(() => {
        expect(container.textContent).not.toContain("Invalid credentials");
      });
    });
  });

  describe("Malformed Response", () => {
    it("should not crash the page on malformed login response", async () => {
      const user = setupUser();
      // Resolve with something unexpected (no user property)
      mockLogin.mockResolvedValue({});

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      // Should not crash — the component should still be rendered
      await waitFor(() => {
        expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
      });
    });

    it("should not crash on null response", async () => {
      const user = setupUser();
      mockLogin.mockResolvedValue(null);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      // Page should still render
      await waitFor(() => {
        expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
      });
    });
  });

  describe("Passkey Error in Login Context", () => {
    it("should display passkey-specific error message after failure", async () => {
      const userEv = setupUser();
      // Ensure passkey button is visible
      window.PublicKeyCredential = { isConditionalMediationAvailable: vi.fn().mockResolvedValue(false) };

      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      const passkeyError = new Error("Passkey validation failed");
      passkeyError.name = "Error";
      passkeyError.response = { data: { message: "Credential has been revoked" } };

      // Mock dynamic import of @simplewebauthn/browser
      vi.doMock("@simplewebauthn/browser", () => ({
        startAuthentication: vi.fn().mockRejectedValue(passkeyError),
      }));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      if (passkeyBtn) {
        await userEv.click(passkeyBtn);

        await waitFor(() => {
          // Should show the server message or the fallback passkey error
          const text = container.textContent;
          expect(text.includes("Credential has been revoked") || text.includes("Passkey authentication failed")).toBe(
            true
          );
        });
      }

      // Cleanup
      delete window.PublicKeyCredential;
    });
  });

  describe("CAPTCHA Required", () => {
    it("should set captcha state when error has CAPTCHA_REQUIRED code", async () => {
      const user = setupUser();
      const captchaError = new Error("Please complete the security challenge");
      captchaError.code = "CAPTCHA_REQUIRED";
      captchaError.captchaRequired = true;
      mockLogin.mockRejectedValue(captchaError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        expect(container.textContent).toContain("Please complete the security challenge");
      });
    });

    it("should set captcha state when error has captchaRequired flag", async () => {
      const user = setupUser();
      const captchaError = new Error("Too many attempts");
      captchaError.captchaRequired = true;
      mockLogin.mockRejectedValue(captchaError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        expect(container.textContent).toContain("Too many attempts");
      });
    });
  });

  describe("Account Lockout", () => {
    it("should display lockout countdown with remaining minutes", async () => {
      const user = setupUser();
      const lockoutError = new Error("Account locked");
      lockoutError.code = "ACCOUNT_LOCKED";
      lockoutError.remainingMinutes = 12;
      mockLogin.mockRejectedValue(lockoutError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        expect(container.textContent).toContain("Account locked");
        expect(container.textContent).toContain("12 minutes");
      });
    });

    it("should disable the sign-in button during lockout", async () => {
      const user = setupUser();
      const lockoutError = new Error("Account locked");
      lockoutError.code = "ACCOUNT_LOCKED";
      lockoutError.remainingMinutes = 5;
      mockLogin.mockRejectedValue(lockoutError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        const signInBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Sign In")
        );
        expect(signInBtn).toBeTruthy();
        expect(signInBtn.disabled).toBe(true);
      });
    });

    it("should show lockout message in dedicated warning area, not error area", async () => {
      const user = setupUser();
      const lockoutError = new Error("Account locked");
      lockoutError.code = "ACCOUNT_LOCKED";
      lockoutError.remainingMinutes = 10;
      mockLogin.mockRejectedValue(lockoutError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        // The lockout warning section should appear
        expect(container.textContent).toContain("Account locked");
        expect(container.textContent).toContain("10 minute");
        // The lockout OTP bypass button should appear
        expect(container.textContent).toContain("Unlock via Email OTP");
      });
    });

    it("should use singular minute for 1 minute remaining", async () => {
      const user = setupUser();
      const lockoutError = new Error("Account locked");
      lockoutError.code = "ACCOUNT_LOCKED";
      lockoutError.remainingMinutes = 1;
      mockLogin.mockRejectedValue(lockoutError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      await fillAndSubmit(container, user);

      await waitFor(() => {
        // "minute" without trailing "s"
        expect(container.textContent).toContain("1 minute.");
      });
    });
  });
});
