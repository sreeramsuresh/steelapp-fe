/**
 * InvoiceAllocationConfirmation Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/invoices/1/allocation" }),
  useParams: () => ({ invoiceId: "1" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/invoiceService", () => ({
  invoiceService: {
    getById: vi.fn().mockResolvedValue({ invoice: { id: 1, items: [] } }),
    confirmAllocation: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/notificationService", () => ({
  default: { success: vi.fn(), error: vi.fn() },
  notificationService: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../services/warehouseService", () => ({
  warehouseService: {
    getAllocations: vi.fn().mockResolvedValue({ allocations: [] }),
  },
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import InvoiceAllocationConfirmation from "../InvoiceAllocationConfirmation";

describe("InvoiceAllocationConfirmation", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<InvoiceAllocationConfirmation />);
    expect(container).toBeTruthy();
  });
});
