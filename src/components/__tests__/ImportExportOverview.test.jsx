/**
 * ImportExportOverview Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/exportOrderService", () => ({
  exportOrderService: {
    getStats: vi.fn().mockResolvedValue({ total: 0 }),
    getAll: vi.fn().mockResolvedValue({ orders: [] }),
  },
}));

vi.mock("../../services/importOrderService", () => ({
  importOrderService: {
    getStats: vi.fn().mockResolvedValue({ total: 0 }),
    getAll: vi.fn().mockResolvedValue({ orders: [] }),
  },
}));

vi.mock("../../services/materialCertificateService", () => ({
  materialCertificateService: {
    getAll: vi.fn().mockResolvedValue({ certificates: [] }),
  },
}));

vi.mock("../../services/shippingDocumentService", () => ({
  shippingDocumentService: {
    getAll: vi.fn().mockResolvedValue({ documents: [] }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatDateDMY: (val) => val,
}));

import ImportExportOverview from "../ImportExportOverview";

describe("ImportExportOverview", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<ImportExportOverview />);
    expect(container).toBeTruthy();
  });
});
