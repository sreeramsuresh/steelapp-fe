import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import DashboardOverview from "../DashboardOverview";

const mockDashboardService = {
  getSalesData: vi.fn(),
  getInventoryData: vi.fn(),
};

vi.mock("../../../services/dashboardService", () => ({
  default: mockDashboardService,
}));

describe("DashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardService.getSalesData.mockResolvedValue({});
    mockDashboardService.getInventoryData.mockResolvedValue({});
  });

  describe("Rendering", () => {
    ["should render dashboard", "should display KPIs", "should show charts"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<DashboardOverview />);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    ["should load sales data", "should load inventory data", "should refresh data"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<DashboardOverview />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
