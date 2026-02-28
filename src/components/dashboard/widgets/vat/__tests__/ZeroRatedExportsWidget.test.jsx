import { render, screen } from "@testing-library/react";
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
      },
      exports: [
        {
          id: 1,
          customer: "Export Corp",
          value: 150000,
          destination: "India",
          documentStatus: "complete",
        },
      ],
    };
    render(<ZeroRatedExportsWidget data={data} />);
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
