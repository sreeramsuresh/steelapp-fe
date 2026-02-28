import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/batchReservationService", () => ({
  batchReservationService: {
    getAvailableBatches: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

import BatchAllocator from "../BatchAllocator";

describe("BatchAllocator", () => {
  it("renders without crashing when closed", () => {
    const { container } = render(
      <BatchAllocator
        open={false}
        onClose={vi.fn()}
        productId={1}
        warehouseId={1}
        requiredQuantity={100}
        onAllocate={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders when open", () => {
    const { container } = render(
      <BatchAllocator
        open={true}
        onClose={vi.fn()}
        productId={1}
        warehouseId={1}
        requiredQuantity={100}
        onAllocate={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });
});
