import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/pricelistService", () => ({
  default: {
    updateItems: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import QuickPriceEditModal from "../QuickPriceEditModal";

describe("QuickPriceEditModal", () => {
  it("returns null when not open", () => {
    const { container } = render(
      <QuickPriceEditModal isOpen={false} onClose={vi.fn()} productId={1} productName="Test" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal with product name", () => {
    render(
      <QuickPriceEditModal
        isOpen={true}
        onClose={vi.fn()}
        productId={1}
        productName="SS-304-Sheet"
        currentPrice={100}
        defaultPricelistId={1}
      />
    );
    expect(screen.getByText("Update Base Price")).toBeInTheDocument();
    expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
  });

  it("renders save and cancel buttons", () => {
    render(
      <QuickPriceEditModal
        isOpen={true}
        onClose={vi.fn()}
        productId={1}
        productName="Test"
        currentPrice={100}
        defaultPricelistId={1}
      />
    );
    expect(screen.getByText("Save Price")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
