/**
 * RevenueTrends Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
}));

vi.mock("date-fns", () => ({
  addMonths: vi.fn().mockReturnValue(new Date()),
  format: vi.fn().mockReturnValue("2025-01"),
  subMonths: vi.fn().mockReturnValue(new Date()),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Area: () => <div />,
  AreaChart: ({ children }) => <div>{children}</div>,
}));

import RevenueTrends from "../RevenueTrends";

describe("RevenueTrends", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<RevenueTrends />);
    expect(container).toBeTruthy();
  });
});
