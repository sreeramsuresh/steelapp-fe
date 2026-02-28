import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ImpactTable from "../ImpactTable";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ImpactTable", () => {
  const columns = [
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", align: "right" },
  ];

  const rows = [
    { _key: "row1", description: "Output VAT", amount: "AED 500.00" },
    { _key: "row2", description: "Input VAT", amount: "AED 200.00" },
    { _key: "total", description: "Net", amount: "AED 300.00", _isTotal: true },
  ];

  it("returns null when no columns", () => {
    const { container } = renderWithTheme(
      <ImpactTable columns={[]} rows={rows} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when no rows", () => {
    const { container } = renderWithTheme(
      <ImpactTable columns={columns} rows={[]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders table with columns and rows", () => {
    renderWithTheme(
      <ImpactTable columns={columns} rows={rows} />
    );
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Output VAT")).toBeInTheDocument();
    expect(screen.getByText("AED 500.00")).toBeInTheDocument();
  });

  it("shows domain label for vat domain", () => {
    renderWithTheme(
      <ImpactTable columns={columns} rows={rows} domains={["vat"]} />
    );
    expect(screen.getByText("VAT Impact")).toBeInTheDocument();
  });

  it("shows domain label for gl domain", () => {
    renderWithTheme(
      <ImpactTable columns={columns} rows={rows} domains={["gl"]} />
    );
    expect(screen.getByText("General Ledger Impact")).toBeInTheDocument();
  });

  it("shows default label when no domains", () => {
    renderWithTheme(
      <ImpactTable columns={columns} rows={rows} />
    );
    expect(screen.getByText("Impact Summary")).toBeInTheDocument();
  });
});
