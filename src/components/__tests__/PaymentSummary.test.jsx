/**
 * PaymentSummary Component Tests
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
}));

vi.mock("../../utils/paymentUtils", () => ({
  calculateBalanceDue: vi.fn().mockReturnValue(5000),
  calculatePaymentStatus: vi.fn().mockReturnValue("partially_paid"),
  calculateTotalPaid: vi.fn().mockReturnValue(5000),
  getPaymentStatusConfig: vi.fn().mockReturnValue({
    label: "Partially Paid",
    color: "yellow",
  }),
}));

import PaymentSummary from "../PaymentSummary";

describe("PaymentSummary", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<PaymentSummary invoiceTotal={10000} payments={[]} />);
    expect(container).toBeTruthy();
  });
});
