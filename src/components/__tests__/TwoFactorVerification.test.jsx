/**
 * TwoFactorVerification Component Tests
 * Phase 3C: Core auth component
 */

import { waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

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

// Mock auth service
const mockVerify2FA = vi.fn();
const mockSendEmailOTP = vi.fn();

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    verify2FA: (...args) => mockVerify2FA(...args),
    sendEmailOTP: (...args) => mockSendEmailOTP(...args),
  },
}));

import TwoFactorVerification from "../TwoFactorVerification";

describe("TwoFactorVerification", () => {
  let mockOnVerified;
  let mockOnCancel;
  const defaultProps = {
    twoFactorToken: "test-token-123",
    methods: ["totp"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnVerified = vi.fn();
    mockOnCancel = vi.fn();
    mockVerify2FA.mockReset();
    mockSendEmailOTP.mockReset();
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container).toBeTruthy();
    });

    it("should display Two-Factor Authentication heading", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("Two-Factor Authentication");
    });

    it("should display TOTP instructions by default", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("authenticator app");
    });

    it("should render code input", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });

    it("should render Verify button", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("Verify");
    });

    it("should render cancel button", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("Use a different account");
    });
  });

  describe("Code Input", () => {
    it("should accept numeric input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');

      await user.type(input, "12345");
      expect(input.value).toBe("12345");
    });

    it("should auto-submit when 6 digits are entered for TOTP", async () => {
      const user = setupUser();
      mockVerify2FA.mockResolvedValue({ user: { id: 1 } });

      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');

      await user.type(input, "123456");

      await waitFor(() => {
        expect(mockVerify2FA).toHaveBeenCalledWith("test-token-123", "123456", "totp");
      });
    });
  });

  describe("Verification", () => {
    it("should call onVerified on successful verification", async () => {
      const user = setupUser();
      const mockResponse = { user: { id: 1, name: "Test" } };
      mockVerify2FA.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');

      await user.type(input, "123456");

      await waitFor(() => {
        expect(mockOnVerified).toHaveBeenCalledWith(mockResponse);
      });
    });

    it("should show error on failed verification", async () => {
      const user = setupUser();
      mockVerify2FA.mockRejectedValue(new Error("Invalid code"));

      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');

      await user.type(input, "123456");

      await waitFor(() => {
        expect(container.textContent).toContain("Invalid code");
      });
    });

    it("should clear code on failed verification", async () => {
      const user = setupUser();
      mockVerify2FA.mockRejectedValue(new Error("Wrong code"));

      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      const input = container.querySelector('input[type="text"]');

      await user.type(input, "123456");

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  describe("Method Switching", () => {
    it("should show email option", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("Send code via email");
    });

    it("should show recovery code option", () => {
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );
      expect(container.textContent).toContain("Use a recovery code");
    });

    it("should switch to email method and send OTP", async () => {
      const user = setupUser();
      mockSendEmailOTP.mockResolvedValue({});

      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );

      const emailBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent.includes("Send code via email")
      );
      await user.click(emailBtn);

      await waitFor(() => {
        expect(mockSendEmailOTP).toHaveBeenCalledWith("test-token-123");
      });
    });

    it("should switch to recovery method", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );

      const recoveryBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent.includes("Use a recovery code")
      );
      await user.click(recoveryBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("recovery codes");
      });
    });
  });

  describe("Cancel", () => {
    it("should call onCancel when cancel button is clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(
        <TwoFactorVerification {...defaultProps} onVerified={mockOnVerified} onCancel={mockOnCancel} />
      );

      const cancelBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent.includes("Use a different account")
      );
      await user.click(cancelBtn);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
