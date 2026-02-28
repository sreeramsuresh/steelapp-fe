/**
 * ConfirmDialog Component Tests
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

vi.mock("../../hooks/useEscapeKey", () => ({
  default: vi.fn(),
}));

import ConfirmDialog from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Delete Item?",
    message: "This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "danger",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("returns null when not open", () => {
    const { container } = renderWithProviders(<ConfirmDialog {...defaultProps} open={false} />);
    expect(container.querySelector(".fixed")).toBeFalsy();
  });

  it("displays title and message", () => {
    const { container } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
    expect(container.textContent).toContain("Delete Item?");
    expect(container.textContent).toContain("This action cannot be undone.");
  });

  it("displays confirm and cancel buttons", () => {
    const { container } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
    expect(container.textContent).toContain("Delete");
    expect(container.textContent).toContain("Cancel");
  });
});
