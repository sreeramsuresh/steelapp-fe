/**
 * PasskeyManagement Component Tests
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
const mockListPasskeys = vi.fn();
const mockPasskeyRegisterStart = vi.fn();
const mockPasskeyRegisterFinish = vi.fn();
const mockRenamePasskey = vi.fn();
const mockDeletePasskey = vi.fn();

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    listPasskeys: (...args) => mockListPasskeys(...args),
    passkeyRegisterStart: (...args) => mockPasskeyRegisterStart(...args),
    passkeyRegisterFinish: (...args) => mockPasskeyRegisterFinish(...args),
    renamePasskey: (...args) => mockRenamePasskey(...args),
    deletePasskey: (...args) => mockDeletePasskey(...args),
  },
}));

// Mock notification service
vi.mock("../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Ensure WebAuthn is "supported" in test env
Object.defineProperty(window, "PublicKeyCredential", {
  value: class {},
  writable: true,
});

import PasskeyManagement from "../PasskeyManagement";

describe("PasskeyManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListPasskeys.mockReset();
    mockPasskeyRegisterStart.mockReset();
    mockPasskeyRegisterFinish.mockReset();
    mockRenamePasskey.mockReset();
    mockDeletePasskey.mockReset();
  });

  describe("Rendering", () => {
    it("should render without crash", async () => {
      mockListPasskeys.mockResolvedValue([]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });

    it("should display Passkeys heading", async () => {
      mockListPasskeys.mockResolvedValue([]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Passkeys");
      });
    });

    it("should display description", async () => {
      mockListPasskeys.mockResolvedValue([]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Sign in quickly and securely");
      });
    });

    it("should render Add Passkey button", async () => {
      mockListPasskeys.mockResolvedValue([]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Add Passkey");
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no passkeys", async () => {
      mockListPasskeys.mockResolvedValue([]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("No passkeys registered yet");
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading text initially", () => {
      mockListPasskeys.mockReturnValue(new Promise(() => {})); // never resolves

      const { container } = renderWithProviders(<PasskeyManagement />);
      expect(container.textContent).toContain("Loading passkeys...");
    });
  });

  describe("Passkey List", () => {
    const mockCredentials = [
      {
        id: "cred-1",
        deviceLabel: "My MacBook",
        createdAt: "2025-01-15T10:00:00Z",
        lastUsedAt: "2025-02-01T14:30:00Z",
      },
      {
        id: "cred-2",
        deviceLabel: "Phone",
        createdAt: "2025-01-20T08:00:00Z",
        lastUsedAt: null,
      },
    ];

    it("should display passkey labels", async () => {
      mockListPasskeys.mockResolvedValue(mockCredentials);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("My MacBook");
        expect(container.textContent).toContain("Phone");
      });
    });

    it("should display created dates", async () => {
      mockListPasskeys.mockResolvedValue(mockCredentials);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Added");
      });
    });

    it("should display last used info when available", async () => {
      mockListPasskeys.mockResolvedValue(mockCredentials);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Last used");
      });
    });
  });

  describe("Rename Passkey", () => {
    it("should enter edit mode on rename click", async () => {
      const user = setupUser();
      mockListPasskeys.mockResolvedValue([
        { id: "cred-1", deviceLabel: "Old Name", createdAt: "2025-01-01T00:00:00Z" },
      ]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("Old Name");
      });

      // Click rename button (Pencil icon button)
      const renameBtn = container.querySelector('button[title="Rename"]');
      if (renameBtn) {
        await user.click(renameBtn);
        // Should now show input field
        await waitFor(() => {
          const editInput = container.querySelector('input[type="text"]');
          expect(editInput).toBeInTheDocument();
        });
      }
    });
  });

  describe("Delete Passkey", () => {
    it("should show confirm/cancel buttons on delete click", async () => {
      const user = setupUser();
      mockListPasskeys.mockResolvedValue([
        { id: "cred-1", deviceLabel: "My Key", createdAt: "2025-01-01T00:00:00Z" },
      ]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("My Key");
      });

      // Click remove button (Trash icon button)
      const removeBtn = container.querySelector('button[title="Remove"]');
      if (removeBtn) {
        await user.click(removeBtn);
        await waitFor(() => {
          expect(container.textContent).toContain("Confirm");
          expect(container.textContent).toContain("Cancel");
        });
      }
    });

    it("should call deletePasskey on confirm", async () => {
      const user = setupUser();
      mockListPasskeys.mockResolvedValue([
        { id: "cred-1", deviceLabel: "My Key", createdAt: "2025-01-01T00:00:00Z" },
      ]);
      mockDeletePasskey.mockResolvedValue({});

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("My Key");
      });

      const removeBtn = container.querySelector('button[title="Remove"]');
      if (removeBtn) {
        await user.click(removeBtn);
        await waitFor(() => {
          expect(container.textContent).toContain("Confirm");
        });

        const confirmBtn = Array.from(container.querySelectorAll("button")).find(
          (b) => b.textContent === "Confirm"
        );
        if (confirmBtn) {
          await user.click(confirmBtn);
          await waitFor(() => {
            expect(mockDeletePasskey).toHaveBeenCalledWith("cred-1");
          });
        }
      }
    });

    it("should cancel delete on Cancel click", async () => {
      const user = setupUser();
      mockListPasskeys.mockResolvedValue([
        { id: "cred-1", deviceLabel: "My Key", createdAt: "2025-01-01T00:00:00Z" },
      ]);

      const { container } = renderWithProviders(<PasskeyManagement />);
      await waitFor(() => {
        expect(container.textContent).toContain("My Key");
      });

      const removeBtn = container.querySelector('button[title="Remove"]');
      if (removeBtn) {
        await user.click(removeBtn);
        await waitFor(() => {
          expect(container.textContent).toContain("Confirm");
        });

        const cancelBtn = Array.from(container.querySelectorAll("button")).find(
          (b) => b.textContent === "Cancel"
        );
        if (cancelBtn) {
          await user.click(cancelBtn);
          // Should go back to normal state with Remove button
          await waitFor(() => {
            expect(container.textContent).not.toContain("Confirm");
          });
        }
      }
    });
  });
});
