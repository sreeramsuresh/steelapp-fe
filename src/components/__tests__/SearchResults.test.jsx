/**
 * SearchResults Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/search" }),
  useSearchParams: () => [new URLSearchParams("q=test"), vi.fn()],
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../../services/dataService", () => ({
  customerService: {
    search: vi.fn().mockResolvedValue({ customers: [] }),
  },
  invoiceService: {
    search: vi.fn().mockResolvedValue({ invoices: [] }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
}));

import SearchResults from "../SearchResults";

describe("SearchResults", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<SearchResults />);
    expect(container).toBeTruthy();
  });
});
