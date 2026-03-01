/**
 * TwoFactorSetup Component Tests
 * Phase 3C: Core auth component
 */

import { waitFor } from "@testing-library/react";
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
const mockSetup2FA = vi.fn();
const mockVerifySetup2FA = vi.fn();

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    setup2FA: (...args) => mockSetup2FA(...args),
    verifySetup2FA: (...args) => mockVerifySetup2FA(...args),
  },
}));

// Mock QRCodeSVG
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => (
    <div data-testid="qr-code" data-value={value}>
      QR Code
    </div>
  ),
}));

import TwoFactorSetup from "../TwoFactorSetup";

describe("TwoFactorSetup", () => {
  let mockOnComplete;
  let mockOnCancel;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnComplete = vi.fn();
    mockOnCancel = vi.fn();
    mockSetup2FA.mockReset();
    mockVerifySetup2FA.mockReset();
  });

  describe("Step 1: Introduction", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      expect(container).toBeTruthy();
    });

    it("should display enable 2FA heading", () => {
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      expect(container.textContent).toContain("Enable Two-Factor Authentication");
    });

    it("should display description about authenticator apps", () => {
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      expect(container.textContent).toContain("authenticator app");
    });

    it("should render Begin Setup button", () => {
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      expect(container.textContent).toContain("Begin Setup");
    });

    it("should render Cancel button", () => {
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      expect(container.textContent).toContain("Cancel");
    });

    it("should call onCancel when Cancel is clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const cancelBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
      await user.click(cancelBtn);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Step 1 -> Step 2 Transition", () => {
    it("should call setup2FA and advance to step 2", async () => {
      const user = setupUser();
      mockSetup2FA.mockResolvedValue({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/UltimateSteel:test@test.com?secret=JBSWY3DPEHPK3PXP",
      });

      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const beginBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Begin Setup")
      );
      await user.click(beginBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Scan QR Code");
      });
    });

    it("should show error if setup fails", async () => {
      const user = setupUser();
      mockSetup2FA.mockRejectedValue(new Error("Setup failed"));

      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const beginBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Begin Setup")
      );
      await user.click(beginBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Setup failed");
      });
    });
  });

  describe("Step 2: QR Code + Verify", () => {
    const setupStep2 = async () => {
      const user = setupUser();
      mockSetup2FA.mockResolvedValue({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP",
      });

      const result = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const beginBtn = Array.from(result.container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Begin Setup")
      );
      await user.click(beginBtn);

      await waitFor(() => {
        expect(result.container.textContent).toContain("Scan QR Code");
      });

      return { ...result, user };
    };

    it("should display QR code", async () => {
      const { container } = await setupStep2();
      const qr = container.querySelector('[data-testid="qr-code"]');
      expect(qr).toBeInTheDocument();
    });

    it("should display secret key for manual entry", async () => {
      const { container } = await setupStep2();
      expect(container.textContent).toContain("JBSWY3DPEHPK3PXP");
    });

    it("should render verification code input", async () => {
      const { container } = await setupStep2();
      const input = container.querySelector("#totp-verify");
      expect(input).toBeInTheDocument();
    });

    it("should render Verify & Enable button", async () => {
      const { container } = await setupStep2();
      expect(container.textContent).toContain("Verify & Enable");
    });
  });

  describe("Step 2 -> Step 3 Transition", () => {
    it("should advance to recovery codes on successful verification", async () => {
      const user = setupUser();
      mockSetup2FA.mockResolvedValue({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP",
      });
      mockVerifySetup2FA.mockResolvedValue({
        recoveryCodes: ["code1", "code2", "code3"],
      });

      const { container } = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Step 1 -> Step 2
      const beginBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Begin Setup")
      );
      await user.click(beginBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Scan QR Code");
      });

      // Enter code and verify
      const input = container.querySelector("#totp-verify");
      await user.type(input, "123456");

      const verifyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Verify & Enable")
      );
      await user.click(verifyBtn);

      await waitFor(() => {
        expect(container.textContent).toContain("Two-Factor Authentication Enabled");
      });
    });
  });

  describe("Step 3: Recovery Codes", () => {
    const setupStep3 = async () => {
      const user = setupUser();
      mockSetup2FA.mockResolvedValue({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP",
      });
      mockVerifySetup2FA.mockResolvedValue({
        recoveryCodes: ["abc-123", "def-456", "ghi-789"],
      });

      const result = renderWithProviders(<TwoFactorSetup onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Step 1 -> 2
      const beginBtn = Array.from(result.container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Begin Setup")
      );
      await user.click(beginBtn);
      await waitFor(() => expect(result.container.textContent).toContain("Scan QR Code"));

      // Step 2 -> 3
      const input = result.container.querySelector("#totp-verify");
      await user.type(input, "123456");
      const verifyBtn = Array.from(result.container.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Verify & Enable")
      );
      await user.click(verifyBtn);
      await waitFor(() => expect(result.container.textContent).toContain("Two-Factor Authentication Enabled"));

      return { ...result, user };
    };

    it("should display recovery codes", async () => {
      const { container } = await setupStep3();
      expect(container.textContent).toContain("abc-123");
      expect(container.textContent).toContain("def-456");
    });

    it("should render Copy and Download buttons", async () => {
      const { container } = await setupStep3();
      expect(container.textContent).toContain("Copy");
      expect(container.textContent).toContain("Download");
    });

    it("should render confirmation checkbox", async () => {
      const { container } = await setupStep3();
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeInTheDocument();
      expect(container.textContent).toContain("I've saved these recovery codes");
    });

    it("should disable Done button until checkbox is checked", async () => {
      const { container, user } = await setupStep3();
      const doneBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Done");
      expect(doneBtn.disabled).toBe(true);

      const checkbox = container.querySelector('input[type="checkbox"]');
      await user.click(checkbox);
      expect(doneBtn.disabled).toBe(false);
    });

    it("should call onComplete when Done is clicked", async () => {
      const { container, user } = await setupStep3();

      const checkbox = container.querySelector('input[type="checkbox"]');
      await user.click(checkbox);

      const doneBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Done");
      await user.click(doneBtn);

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
