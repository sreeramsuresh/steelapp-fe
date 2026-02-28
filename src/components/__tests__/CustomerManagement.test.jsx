/**
 * CustomerManagement Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/customers" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { customers: [], total: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: { customers: [], total: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../../hooks/useEscapeKey", () => ({
  default: vi.fn(),
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
  formatDateDMY: (val) => val,
}));

vi.mock("date-fns", () => ({
  format: vi.fn().mockReturnValue("01/01/2025"),
}));

import CustomerManagement from "../CustomerManagement";

describe("CustomerManagement", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<CustomerManagement />);
    expect(container).toBeTruthy();
  });
});
