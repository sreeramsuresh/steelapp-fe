import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InvoiceSignatureSection from "../InvoiceSignatureSection";

describe("InvoiceSignatureSection", () => {
  it("renders authorized signatory text", () => {
    render(<InvoiceSignatureSection company={{}} />);
    expect(screen.getByText("Authorised Signatory")).toBeInTheDocument();
  });

  it("renders company name", () => {
    render(<InvoiceSignatureSection company={{}} />);
    expect(screen.getByText("ULTIMATE STEELS")).toBeInTheDocument();
    expect(screen.getByText("BUILDING MATERIALS TRADING")).toBeInTheDocument();
  });

  it("renders seal image when pdfSealUrl provided", () => {
    render(<InvoiceSignatureSection company={{ pdfSealUrl: "/uploads/seal.png" }} />);
    const img = screen.getByAltText("Company Seal");
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/uploads/seal.png");
  });

  it("renders seal image from sealUrl fallback", () => {
    render(<InvoiceSignatureSection company={{ sealUrl: "https://example.com/seal.png" }} />);
    const img = screen.getByAltText("Company Seal");
    expect(img.src).toBe("https://example.com/seal.png");
  });

  it("hides seal when no seal URL", () => {
    render(<InvoiceSignatureSection company={{}} />);
    expect(screen.queryByAltText("Company Seal")).not.toBeInTheDocument();
  });
});
