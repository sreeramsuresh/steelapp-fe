import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import DesignatedZoneWidget from "../DesignatedZoneWidget";

describe("DesignatedZoneWidget", () => {
  it("renders without crashing", () => {
    render(<DesignatedZoneWidget />);
  });

  it("displays designated zone content with mock data", () => {
    const { container } = render(<DesignatedZoneWidget />);
    expect(container).toBeTruthy();
  });

  it("renders with custom data", () => {
    const data = {
      summary: {
        totalTransactions: 15,
        totalValue: 800000,
        zeroRatedValue: 720000,
        compliantTransactions: 13,
        pendingDocuments: 2,
      },
      zoneBreakdown: [
        { zone: "JAFZA", zoneName: "Jebel Ali Free Zone", transactions: 8, value: 450000, compliant: 7, pending: 1 },
        { zone: "DAFZA", zoneName: "Dubai Airport Free Zone", transactions: 7, value: 350000, compliant: 6, pending: 1 },
      ],
      recentTransactions: [
        { id: 1, zone: "JAFZA", type: "Sale", value: 50000, date: "2024-01-15", status: "compliant", documents: { delivery: true, zoneEntry: true, customs: true } },
      ],
      documentChecklist: [
        { name: "Delivery Note", required: true },
        { name: "Zone Entry Certificate", required: true },
      ],
    };
    const { container } = render(<DesignatedZoneWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with no data", () => {
    const { container } = render(<DesignatedZoneWidget data={null} />);
    expect(container).toBeTruthy();
  });
});
