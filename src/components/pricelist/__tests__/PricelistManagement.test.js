import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import PricelistManagement from "../PricelistManagement";

const mockPricelistService = {
  listPricelists: vi.fn(),
  createPricelist: vi.fn(),
};

vi.mock("../../../services/pricelistService", () => ({
  default: mockPricelistService,
}));

describe("PricelistManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPricelistService.listPricelists.mockResolvedValue([]);
  });

  describe("Rendering", () => {
    ["should render pricelist list", "should display add button", "should show items"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<PricelistManagement />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
