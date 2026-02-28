/**
 * InvoiceStatusColumn Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../utils/invoiceStatus", () => ({
  getInvoiceStatusBadges: vi.fn().mockReturnValue([
    {
      key: "status",
      label: "Draft",
      config: {
        bgLight: "bg-gray-100",
        bgDark: "bg-gray-800",
        textLight: "text-gray-800",
        textDark: "text-gray-300",
        borderLight: "border-gray-300",
        borderDark: "border-gray-600",
      },
    },
  ]),
}));

import InvoiceStatusColumn from "../InvoiceStatusColumn";

describe("InvoiceStatusColumn", () => {
  const invoice = { id: 1, status: "draft", paymentStatus: "unpaid" };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <InvoiceStatusColumn invoice={invoice} isDarkMode={false} />
    );
    expect(container).toBeTruthy();
  });

  it("displays status badge", () => {
    const { container } = renderWithProviders(
      <InvoiceStatusColumn invoice={invoice} isDarkMode={false} />
    );
    expect(container.textContent).toContain("Draft");
  });
});
