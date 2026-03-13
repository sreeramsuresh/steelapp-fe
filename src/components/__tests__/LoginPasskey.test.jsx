/**
 * Login Passkey Tests
 * Tests passkey/WebAuthn UI logic in the login page
 */

import { waitFor } from "@testing-library/react";
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

// Mock @simplewebauthn/browser (dynamic import)
const mockStartAuthentication = vi.fn();
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: (...args) => mockStartAuthentication(...args),
}));

import Login from "../Login";

describe("Login — Passkey", () => {
  let mockOnLoginSuccess;
  let originalPublicKeyCredential;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess = vi.fn();
    mockLogin.mockReset();
    mockPasskeyLoginStart.mockReset();
    mockPasskeyLoginFinish.mockReset();
    mockStartAuthentication.mockReset();
    // Save original
    originalPublicKeyCredential = window.PublicKeyCredential;
  });

  afterEach(() => {
    // Restore original
    if (originalPublicKeyCredential !== undefined) {
      window.PublicKeyCredential = originalPublicKeyCredential;
    } else {
      delete window.PublicKeyCredential;
    }
  });

  describe("Passkey Button Visibility", () => {
    it("should render passkey button when PublicKeyCredential is supported", () => {
      window.PublicKeyCredential = { isConditionalMediationAvailable: vi.fn().mockResolvedValue(false) };
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1" });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(container.textContent).toContain("Sign in with Passkey");
    });

    it("should hide passkey button when PublicKeyCredential is not supported", () => {
      delete window.PublicKeyCredential;

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(container.textContent).not.toContain("Sign in with Passkey");
    });
  });

  describe("Passkey Authentication Flow", () => {
    beforeEach(() => {
      window.PublicKeyCredential = { isConditionalMediationAvailable: vi.fn().mockResolvedValue(false) };
    });

    it("should start WebAuthn authentication when passkey button is clicked", async () => {
      const user = setupUser();
      const mockCredential = { id: "cred-1", type: "public-key" };
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      mockStartAuthentication.mockResolvedValue(mockCredential);
      mockPasskeyLoginFinish.mockResolvedValue({ user: { id: 1, name: "Passkey User" } });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      expect(passkeyBtn).toBeTruthy();
      await user.click(passkeyBtn);

      await waitFor(() => {
        expect(mockPasskeyLoginStart).toHaveBeenCalled();
      });
    });

    it("should show loading state during passkey authentication", async () => {
      const user = setupUser();
      let resolveStart;
      mockPasskeyLoginStart.mockReturnValue(
        new Promise((resolve) => {
          resolveStart = resolve;
        })
      );

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      await user.click(passkeyBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Authenticating...");
      });

      // Clean up
      resolveStart({ ceremonyId: "c1", challenge: "abc" });
    });

    it("should handle cancelled WebAuthn prompt gracefully without showing error", async () => {
      const user = setupUser();
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      const cancelError = new Error("User cancelled");
      cancelError.name = "NotAllowedError";
      mockStartAuthentication.mockRejectedValue(cancelError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      await user.click(passkeyBtn);

      await waitFor(() => {
        // Should not show error for NotAllowedError (user cancellation)
        expect(container.textContent).not.toContain("Passkey authentication failed");
        expect(container.textContent).not.toContain("User cancelled");
      });
    });

    it("should handle AbortError gracefully without showing error", async () => {
      const user = setupUser();
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockStartAuthentication.mockRejectedValue(abortError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      await user.click(passkeyBtn);

      await waitFor(() => {
        expect(container.textContent).not.toContain("Passkey authentication failed");
      });
    });

    it("should show user-friendly error on passkey failure", async () => {
      const user = setupUser();
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      const genericError = new Error("Something went wrong");
      genericError.name = "Error";
      mockStartAuthentication.mockRejectedValue(genericError);

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      await user.click(passkeyBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Passkey authentication failed");
      });
    });

    it("should call onLoginSuccess after successful passkey login", async () => {
      const user = setupUser();
      const mockUser = { id: 1, name: "Passkey User" };
      const mockCredential = { id: "cred-1", type: "public-key" };
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      mockStartAuthentication.mockResolvedValue(mockCredential);
      mockPasskeyLoginFinish.mockResolvedValue({ user: mockUser });

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const passkeyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Sign in with Passkey")
      );
      await user.click(passkeyBtn);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
      });
    });
  });

  describe("Conditional UI (Browser Autofill)", () => {
    it("should start conditional UI on mount when supported", async () => {
      window.PublicKeyCredential = {
        isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
      };
      mockPasskeyLoginStart.mockResolvedValue({ ceremonyId: "c1", challenge: "abc" });
      mockStartAuthentication.mockResolvedValue({ id: "cred-1" });
      mockPasskeyLoginFinish.mockResolvedValue({ user: { id: 1 } });

      renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      await waitFor(() => {
        expect(mockPasskeyLoginStart).toHaveBeenCalled();
      });
    });

    it("should not start conditional UI when isConditionalMediationAvailable returns false", async () => {
      window.PublicKeyCredential = {
        isConditionalMediationAvailable: vi.fn().mockResolvedValue(false),
      };

      renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      // Give time for async effects to settle
      await new Promise((r) => setTimeout(r, 50));

      // passkeyLoginStart should NOT be called for conditional UI when not available
      expect(mockPasskeyLoginStart).not.toHaveBeenCalled();
    });

    it("should silently ignore conditional UI errors", async () => {
      window.PublicKeyCredential = {
        isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
      };
      mockPasskeyLoginStart.mockRejectedValue(new Error("Network error"));

      const { container } = renderWithProviders(<Login onLoginSuccess={mockOnLoginSuccess} />);

      // Should not show any error from conditional UI failure
      await new Promise((r) => setTimeout(r, 50));
      expect(container.textContent).not.toContain("Network error");
      expect(container.textContent).not.toContain("Passkey authentication failed");
    });
  });
});
