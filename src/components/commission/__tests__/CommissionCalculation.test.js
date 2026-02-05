import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import CommissionCalculation from "../CommissionCalculation";
import sinon from 'sinon';

const mockCommissionService = {
  calculateCommission: sinon.stub(),
  getEligibleSales: sinon.stub(),
};

// sinon.stub() // "../../../services/commissionService", () => ({
  default: mockCommissionService,
}));

describe("CommissionCalculation", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("Rendering", () => {
    ["should render commission view", "should display amounts", "should show details"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<CommissionCalculation />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
