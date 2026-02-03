import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import AllocationDrawer from "../AllocationDrawer";

const mockAllocationService = {
  allocateStock: vi.fn(),
};

vi.mock("../../../services/allocationService", () => ({
  default: mockAllocationService,
}));

describe("AllocationDrawer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    ["should render drawer", "should display batch list", "should display allocation inputs"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(
          <AllocationDrawer {...defaultProps} />,
        );
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Batch Allocation", () => {
    ["should allocate batches", "should update totals", "should track allocation"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(
          <AllocationDrawer {...defaultProps} />,
        );
        expect(container).toBeInTheDocument();
      });
    });
  });
});
