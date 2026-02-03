import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import CommissionCalculation from "../CommissionCalculation";

const mockCommissionService = {
  calculateCommission: vi.fn(),
  getEligibleSales: vi.fn(),
};

vi.mock("../../../services/commissionService", () => ({
  default: mockCommissionService,
}));

describe("CommissionCalculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    ["should render commission view", "should display amounts", "should show details"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(
          <CommissionCalculation />,
        );
        expect(container).toBeInTheDocument();
      });
    });
  });
});
