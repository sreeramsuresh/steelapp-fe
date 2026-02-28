/**
 * ProcurementBadge Component Tests
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

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(false),
  },
}));

vi.mock("../../services/stockBatchService", () => ({
  stockBatchService: {
    getProcurementSummary: vi.fn().mockResolvedValue({ localQty: 100, importedQty: 200 }),
  },
}));

import ProcurementBadge from "../ProcurementBadge";

describe("ProcurementBadge", () => {
  it("renders without crashing with pre-loaded quantities", () => {
    const { container } = renderWithProviders(
      <ProcurementBadge localQty={500} importedQty={1200} unit="kg" />
    );
    expect(container).toBeTruthy();
  });

  it("shows LOCAL badge with quantity", () => {
    const { container } = renderWithProviders(
      <ProcurementBadge localQty={500} importedQty={0} unit="kg" />
    );
    expect(container.textContent).toContain("LOCAL");
  });

  it("shows IMPORTED badge with quantity", () => {
    const { container } = renderWithProviders(
      <ProcurementBadge localQty={0} importedQty={1200} unit="kg" />
    );
    expect(container.textContent).toContain("IMPORTED");
  });

  it("returns null when both quantities are zero and showZero is false", () => {
    const { container } = renderWithProviders(
      <ProcurementBadge localQty={0} importedQty={0} />
    );
    expect(container.textContent).toBe("");
  });
});
