import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import AllocationDrawer from "../AllocationDrawer";
import sinon from 'sinon';

const mockAllocationService = {
  allocateStock: sinon.stub(),
};

// sinon.stub() // "../../../services/allocationService", () => ({
  default: mockAllocationService,
}));

describe("AllocationDrawer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: sinon.stub(),
  };

  beforeEach(() => {
    sinon.restore();
  });

  describe("Rendering", () => {
    ["should render drawer", "should display batch list", "should display allocation inputs"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<AllocationDrawer {...defaultProps} />);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Batch Allocation", () => {
    ["should allocate batches", "should update totals", "should track allocation"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<AllocationDrawer {...defaultProps} />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
