/**
 * InvoicePreview Component Tests
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

vi.mock("../../constants/defaultTemplateSettings", () => ({
  DEFAULT_TEMPLATE_SETTINGS: {
    showLogo: true,
    showWatermark: false,
    fontSize: "medium",
    colors: {
      primary: "#0d9488",
      secondary: "#6b7280",
      accent: "#14b8a6",
    },
  },
}));

vi.mock("../../utils/invoicePagination", () => ({
  calculatePagination: vi.fn().mockReturnValue({ totalPages: 1 }),
  splitItemsIntoPages: vi.fn().mockReturnValue([[]]),
}));

vi.mock("./invoice/InvoiceTemplate", () => ({
  default: () => <div data-testid="invoice-template">Invoice Template</div>,
}));

import InvoicePreview from "../InvoicePreview";

describe("InvoicePreview", () => {
  const defaultProps = {
    invoice: {
      id: 1,
      invoiceNumber: "INV-001",
      items: [],
      total: 10000,
      status: "draft",
    },
    company: { name: "Test Company", trn: "123456789012345" },
    onClose: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(<InvoicePreview {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
