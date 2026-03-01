import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InvoiceFooter from "../InvoiceFooter";

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  DEFAULT_TEMPLATE_SETTINGS: { colors: { primary: "#000" } },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  TIMEZONE_DISCLAIMER: "All times are in GST (UTC+4)",
}));

describe("InvoiceFooter", () => {
  const company = { phone: "+971501234567", email: "test@co.com" };

  it("renders page numbers", () => {
    render(<InvoiceFooter company={company} pageNumber={1} totalPages={3} />);
    expect(screen.getByText("Page: 1 / 3")).toBeInTheDocument();
  });

  it("renders company phone", () => {
    render(<InvoiceFooter company={company} pageNumber={1} totalPages={1} />);
    expect(screen.getByText(/\+971501234567/)).toBeInTheDocument();
  });

  it("renders timezone disclaimer", () => {
    render(<InvoiceFooter company={company} pageNumber={1} totalPages={1} />);
    expect(screen.getByText("All times are in GST (UTC+4)")).toBeInTheDocument();
  });

  it("uses default phone when company phone missing", () => {
    render(<InvoiceFooter company={{}} pageNumber={1} totalPages={1} />);
    expect(screen.getByText(/\+971506061680/)).toBeInTheDocument();
  });

  it("applies template colors when provided", () => {
    const template = { colors: { secondary: "#ff0000" }, fonts: { body: "Arial" } };
    const { container } = render(<InvoiceFooter company={company} pageNumber={1} totalPages={1} template={template} />);
    expect(container.innerHTML).toContain("Arial");
  });
});
