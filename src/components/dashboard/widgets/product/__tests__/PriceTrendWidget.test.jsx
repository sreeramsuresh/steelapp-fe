import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import PriceTrendWidget from "../PriceTrendWidget";

describe("PriceTrendWidget", () => {
  const sampleData = {
    products: [
      {
        id: 1,
        name: "SS 304 Sheet",
        currentPrice: 285,
        previousPrice: 275,
        priceChange: 3.6,
        marketPrice: 290,
        history: [
          { price: 270, market: 280 },
          { price: 275, market: 282 },
          { price: 285, market: 290 },
        ],
      },
    ],
  };

  it("renders without crashing", () => {
    render(<PriceTrendWidget data={sampleData} />);
  });

  it("displays product names", () => {
    render(<PriceTrendWidget data={sampleData} />);
    expect(screen.getByText("SS 304 Sheet")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<PriceTrendWidget data={null} />);
    // Should render without crashing
  });

  it("renders with empty products array", () => {
    render(<PriceTrendWidget data={{ products: [] }} />);
    // Should render without crashing
  });
});
