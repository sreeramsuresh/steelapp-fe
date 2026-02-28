/**
 * PaymentLedger Component Tests
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

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
}));

vi.mock("../../utils/paymentReceiptGenerator", () => ({
  generatePaymentReceipt: vi.fn(),
  printPaymentReceipt: vi.fn(),
}));

vi.mock("../../utils/paymentUtils", () => ({
  calculateBalanceDue: vi.fn().mockReturnValue(5000),
  calculateTotalPaid: vi.fn().mockReturnValue(5000),
  formatPaymentDisplay: vi.fn().mockReturnValue("$5,000"),
  getPaymentModeConfig: vi.fn().mockReturnValue({ label: "Cash", icon: "cash" }),
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import PaymentLedger from "../PaymentLedger";

describe("PaymentLedger", () => {
  const defaultProps = {
    payments: [],
    invoice: { id: 1, invoiceNumber: "INV-001", total: 10000 },
    company: { name: "Test Company" },
    onAddPayment: vi.fn(),
    onEditPayment: vi.fn(),
    onDeletePayment: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
