import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/pricelistService", () => ({
  default: {
    getProductPrice: vi.fn().mockResolvedValue({ selling_price: 100 }),
  },
}));

import PricingStatusPanel from "../PricingStatusPanel";

describe("PricingStatusPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<PricingStatusPanel productId={1} sellingPrice={100} />);
    expect(container).toBeTruthy();
  });

  it("shows checking status initially", () => {
    render(<PricingStatusPanel productId={1} sellingPrice={100} />);
    expect(screen.getByText("Checking pricing status...")).toBeInTheDocument();
  });

  it("shows no-price status when no selling price", async () => {
    render(<PricingStatusPanel productId={1} sellingPrice={0} />);
    const label = await screen.findByText("No Selling Price");
    expect(label).toBeInTheDocument();
  });
});
