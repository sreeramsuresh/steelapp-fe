/**
 * PaymentReminderModal Component Tests
 */
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

// Stable mock references — must NOT create new identities per render
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/" };
const mockAuthValue = {
  user: { id: 1, name: "Test User", role: "admin", companyId: 1 },
  isAuthenticated: true,
};
const mockGet = vi.fn().mockResolvedValue([]);
const mockPost = vi.fn().mockResolvedValue({});
const mockPut = vi.fn().mockResolvedValue({});
const mockDelete = vi.fn().mockResolvedValue({});

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
  },
  apiService: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
  },
  tokenUtils: {
    getToken: vi.fn().mockReturnValue("mock-token"),
    getUser: vi.fn().mockReturnValue({ id: 1, name: "Test User" }),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDateTime: (val) => val,
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

vi.mock("../../utils/timezone", () => ({
  formatBusinessDate: (val) => val || "",
  toUAETime: (val) => val || "",
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("../ConfirmDialog", () => ({
  default: () => null,
}));

import PaymentReminderModal from "../PaymentReminderModal";

describe("PaymentReminderModal", () => {
  it("returns null when closed", () => {
    const { container } = renderWithProviders(<PaymentReminderModal isOpen={false} onClose={vi.fn()} />);
    expect(container.querySelector(".fixed")).not.toBeInTheDocument();
  });

  it("renders when open with invoice", async () => {
    const mockInvoice = { id: 1, invoiceNumber: "INV-001", totalAmount: 1000 };
    const { container } = renderWithProviders(
      <PaymentReminderModal invoice={mockInvoice} isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Payment Reminder Calls");
    });

    expect(mockGet).toHaveBeenCalledWith("/invoices/1/payment-reminders");
  });
});
