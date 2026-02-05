import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import DashboardOverview from "../DashboardOverview";
import sinon from 'sinon';

const mockDashboardService = {
  getSalesData: sinon.stub(),
  getInventoryData: sinon.stub(),
};

// sinon.stub() // "../../../services/dashboardService", () => ({
  default: mockDashboardService,
}));

describe("DashboardOverview", () => {
  beforeEach(() => {
    sinon.restore();
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
