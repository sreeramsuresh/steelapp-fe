/**
 * WarehouseManagement Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/warehouses" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { warehouses: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: { warehouses: [] } }),
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
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import WarehouseManagement from "../WarehouseManagement";

describe("WarehouseManagement", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<WarehouseManagement />);
    expect(container).toBeTruthy();
  });
});
