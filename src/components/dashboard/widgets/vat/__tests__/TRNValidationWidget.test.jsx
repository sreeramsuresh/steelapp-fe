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
        pending: 10,
        invalid: 5,
        validationRate: 85,
      },
      entities: [
        {
          id: 1,
          name: "Test Corp",
          trn: "100123456789012",
          type: "customer",
          status: "validated",
        },
      ],
    };
    render(<TRNValidationWidget data={data} />);
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
