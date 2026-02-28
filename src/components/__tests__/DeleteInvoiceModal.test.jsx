/**
 * DeleteInvoiceModal Component Tests
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

import DeleteInvoiceModal from "../DeleteInvoiceModal";

describe("DeleteInvoiceModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    invoice: { id: 1, invoiceNumber: "INV-001", status: "draft" },
  };

  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(<DeleteInvoiceModal {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("returns null when not open", () => {
    const { container } = renderWithProviders(
      <DeleteInvoiceModal {...defaultProps} isOpen={false} />
    );
    expect(container.querySelector(".fixed")).toBeFalsy();
  });

  it("displays Delete Invoice title", () => {
    const { container } = renderWithProviders(<DeleteInvoiceModal {...defaultProps} />);
    expect(container.textContent).toContain("Delete Invoice");
  });

  it("shows deletion reason options", () => {
    const { container } = renderWithProviders(<DeleteInvoiceModal {...defaultProps} />);
    expect(container.textContent).toContain("Duplicate Entry");
    expect(container.textContent).toContain("Entered in Error");
    expect(container.textContent).toContain("Customer Cancellation");
  });

  it("has cancel and delete buttons", () => {
    const { container } = renderWithProviders(<DeleteInvoiceModal {...defaultProps} />);
    expect(container.textContent).toContain("Cancel");
    expect(container.textContent).toContain("Delete Invoice");
  });
});
