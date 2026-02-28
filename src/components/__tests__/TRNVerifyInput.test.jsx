/**
 * TRNVerifyInput Component Tests
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
    verifyTRN: vi.fn().mockResolvedValue({ valid: true, name: "Test Company" }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatDateDMY: (val) => val,
}));

import TRNVerifyInput from "../TRNVerifyInput";

describe("TRNVerifyInput", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<TRNVerifyInput onChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("renders an input element", () => {
    const { container } = renderWithProviders(<TRNVerifyInput onChange={vi.fn()} />);
    const input = container.querySelector("input");
    expect(input).toBeTruthy();
  });
});
