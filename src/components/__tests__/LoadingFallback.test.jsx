/**
 * LoadingFallback Component Tests
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

import { InvoiceFormLoadingFallback, PageLoadingFallback } from "../LoadingFallback";

describe("InvoiceFormLoadingFallback", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<InvoiceFormLoadingFallback />);
    expect(container).toBeTruthy();
  });

  it("displays loading text", () => {
    const { container } = renderWithProviders(<InvoiceFormLoadingFallback />);
    expect(container.textContent).toContain("Loading invoice form");
  });
});

describe("PageLoadingFallback", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<PageLoadingFallback />);
    expect(container).toBeTruthy();
  });

  it("displays default loading text", () => {
    const { container } = renderWithProviders(<PageLoadingFallback />);
    expect(container.textContent).toContain("Loading...");
  });

  it("displays custom label", () => {
    const { container } = renderWithProviders(<PageLoadingFallback label="Please wait..." />);
    expect(container.textContent).toContain("Please wait...");
  });
});
