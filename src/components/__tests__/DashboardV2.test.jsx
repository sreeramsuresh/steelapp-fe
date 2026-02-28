/**
 * DashboardV2 Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test", role: "admin", company_id: 1 },
    isAuthenticated: true,
  }),
}));

vi.mock("../../services/analyticsService", () => ({
  analyticsService: {
    getDashboardStats: vi.fn().mockResolvedValue({
      totalRevenue: 0,
      totalInvoices: 0,
      totalCustomers: 0,
    }),
  },
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  Line: () => <div />,
  Pie: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
  Area: () => <div />,
  AreaChart: ({ children }) => <div>{children}</div>,
}));

import DashboardV2 from "../DashboardV2";

describe("DashboardV2", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<DashboardV2 />);
    expect(container).toBeTruthy();
  });
});
