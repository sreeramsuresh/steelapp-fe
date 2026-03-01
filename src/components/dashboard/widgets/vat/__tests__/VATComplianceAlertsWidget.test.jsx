import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import VATComplianceAlertsWidget from "../VATComplianceAlertsWidget";

describe("VATComplianceAlertsWidget", () => {
  it("renders without crashing", () => {
    render(<VATComplianceAlertsWidget />);
  });

  it("renders with no data", () => {
    const { container } = render(<VATComplianceAlertsWidget data={null} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom alert data", () => {
    const data = {
      alerts: [
        {
          id: 1,
          type: "warning",
          title: "Missing TRN",
          description: "Customer X missing TRN",
          severity: "medium",
        },
        {
          id: 2,
          type: "error",
          title: "Rate Mismatch",
          description: "Invoice Y has wrong VAT rate",
          severity: "high",
        },
      ],
      summary: { critical: 1, warning: 1, info: 0 },
    };
    render(<VATComplianceAlertsWidget data={data} />);
    const { container } = render(<VATComplianceAlertsWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with callbacks", () => {
    const onAlertClick = vi.fn();
    const onViewAll = vi.fn();
    const { container } = render(<VATComplianceAlertsWidget onAlertClick={onAlertClick} onViewAll={onViewAll} />);
    expect(container).toBeTruthy();
  });

  it("renders with maxAlerts prop", () => {
    const { container } = render(<VATComplianceAlertsWidget maxAlerts={3} />);
    expect(container).toBeTruthy();
  });
});
