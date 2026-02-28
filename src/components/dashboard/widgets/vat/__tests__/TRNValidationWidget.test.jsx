import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import TRNValidationWidget from "../TRNValidationWidget";

describe("TRNValidationWidget", () => {
  it("renders without crashing", () => {
    render(<TRNValidationWidget />);
  });

  it("renders with no data", () => {
    const { container } = render(<TRNValidationWidget data={null} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom data", () => {
    const data = {
      summary: {
        totalEntities: 100,
        validated: 85,
        pendingVerification: 10,
        invalid: 5,
        validationRate: 85,
        lastBatchValidation: "2024-12-26T09:00:00Z",
      },
      byType: {
        customers: { total: 60, validated: 50, invalid: 5, pending: 5 },
        suppliers: { total: 40, validated: 35, invalid: 0, pending: 5 },
      },
      recentValidations: [
        {
          id: 1,
          entityType: "customer",
          name: "Test Corp",
          trn: "100123456789012",
          status: "valid",
          validatedAt: "2024-12-27T10:30:00Z",
          expiryDate: null,
        },
      ],
      invalidTRNs: [],
    };
    const { container } = render(<TRNValidationWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with onRefresh callback", () => {
    const onRefresh = vi.fn();
    const { container } = render(<TRNValidationWidget onRefresh={onRefresh} />);
    expect(container).toBeTruthy();
  });

  it("renders with onValidate callback", () => {
    const onValidate = vi.fn();
    const { container } = render(<TRNValidationWidget onValidate={onValidate} />);
    expect(container).toBeTruthy();
  });
});
