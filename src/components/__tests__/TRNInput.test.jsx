/**
 * TRNInput Component Tests
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

vi.mock("../../services/trnService", () => ({
  trnService: {
    handleInput: vi.fn().mockReturnValue({
      value: "",
      displayValue: "",
      isComplete: false,
      isValid: null,
    }),
    formatForDisplay: vi.fn().mockReturnValue("100-1234-5678-9123"),
  },
}));

import TRNInput from "../TRNInput";

describe("TRNInput", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<TRNInput onChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("renders an input element", () => {
    const { container } = renderWithProviders(<TRNInput onChange={vi.fn()} />);
    const input = container.querySelector("input");
    expect(input).toBeTruthy();
  });

  it("displays label text", () => {
    const { container } = renderWithProviders(<TRNInput onChange={vi.fn()} />);
    expect(container.textContent).toContain("Tax Registration Number");
  });

  it("shows format hint", () => {
    const { container } = renderWithProviders(<TRNInput onChange={vi.fn()} />);
    expect(container.textContent).toContain("UAE TRN: 15 digits");
  });

  it("renders with custom label", () => {
    const { container } = renderWithProviders(
      <TRNInput onChange={vi.fn()} label="Customer TRN" />
    );
    expect(container.textContent).toContain("Customer TRN");
  });
});
