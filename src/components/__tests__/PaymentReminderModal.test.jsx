/**
 * PaymentReminderModal Component Tests
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
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  tokenUtils: {
    getToken: vi.fn().mockReturnValue("mock-token"),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDateTime: (val) => val,
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import PaymentReminderModal from "../PaymentReminderModal";

describe("PaymentReminderModal", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <PaymentReminderModal
        invoiceId={1}
        isOpen={true}
        onClose={vi.fn()}
        isDarkMode={false}
      />
    );
    expect(container).toBeTruthy();
  });
});
