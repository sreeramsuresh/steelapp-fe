import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockBatchService", () => ({
  stockBatchService: {
    getBatchesByProduct: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (v) => `AED ${v}`,
}));

vi.mock("../BatchCostTable", () => ({
  default: () => <div data-testid="batch-cost-table">Table</div>,
}));

import ProductBatchDrawer from "../ProductBatchDrawer";

describe("ProductBatchDrawer", () => {
  it("renders without crashing when closed", () => {
    const { container } = render(
      <ProductBatchDrawer open={false} onClose={vi.fn()} product={null} />
    );
    expect(container).toBeTruthy();
  });

  it("renders when open with product", () => {
    const { container } = render(
      <ProductBatchDrawer
        open={true}
        onClose={vi.fn()}
        product={{ productId: 1, productName: "SS-304" }}
      />
    );
    expect(container).toBeTruthy();
  });
});
