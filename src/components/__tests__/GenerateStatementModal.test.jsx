/**
 * GenerateStatementModal Component Tests
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

vi.mock("../../services/accountStatementService", () => ({
  accountStatementService: {
    generate: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatDate: (val) => val,
  formatCurrency: (val) => `$${val}`,
}));

import GenerateStatementModal from "../GenerateStatementModal";

describe("GenerateStatementModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    customer: { id: 1, name: "Test Customer" },
    onGenerated: vi.fn(),
  };

  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(<GenerateStatementModal {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
