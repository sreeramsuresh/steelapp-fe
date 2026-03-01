import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ZeroRatedExportsWidget from "../ZeroRatedExportsWidget";

describe("ZeroRatedExportsWidget", () => {
  it("renders without crashing", () => {
    render(<ZeroRatedExportsWidget />);
  });

  it("renders with no data", () => {
    const { container } = render(<ZeroRatedExportsWidget data={null} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom data", () => {
    const data = {
      summary: {
        totalExports: 12,
        totalValue: 650000,
        documentedExports: 10,
        pendingDocumentation: 2,
        compliancePercentage: 83.3,
      },
      recentExports: [
        {
          id: 1,
          invoiceNumber: "INV-001",
          customer: "Export Corp",
          amount: 150000,
          country: "India",
          status: "complete",
          daysRemaining: null,
          documents: {
            billOfLading: true,
            customsDeclaration: true,
            exportCertificate: true,
          },
        },
      ],
      documentTypes: [
        { id: 1, name: "Bill of Lading", required: true, complete: 10, pending: 2 },
        { id: 2, name: "Customs Declaration", required: true, complete: 8, pending: 4 },
      ],
    };
    const { container } = render(<ZeroRatedExportsWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it("renders with callbacks", () => {
    const onViewExport = vi.fn();
    const onUploadDocument = vi.fn();
    const { container } = render(
      <ZeroRatedExportsWidget onViewExport={onViewExport} onUploadDocument={onUploadDocument} />
    );
    expect(container).toBeTruthy();
  });
});
