import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ImmutabilityBanner from "../ImmutabilityBanner";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ImmutabilityBanner", () => {
  it("renders banner text", () => {
    renderWithTheme(
      <ImmutabilityBanner text="This document cannot be modified." />
    );
    expect(
      screen.getByText("This document cannot be modified.")
    ).toBeInTheDocument();
  });

  it("shows document type in title when provided", () => {
    renderWithTheme(
      <ImmutabilityBanner
        text="Cannot modify."
        documentType="Invoice"
      />
    );
    expect(
      screen.getByText("Invoice: Immutable After Posting")
    ).toBeInTheDocument();
  });

  it("shows generic title when no documentType", () => {
    renderWithTheme(<ImmutabilityBanner text="Cannot modify." />);
    expect(
      screen.getByText("Immutable After Posting")
    ).toBeInTheDocument();
  });

  it("renders compact mode", () => {
    const { container } = renderWithTheme(
      <ImmutabilityBanner text="Locked." compact={true} />
    );
    expect(screen.getByText("Locked.")).toBeInTheDocument();
    // Compact renders text-xs, no title
    expect(
      screen.queryByText("Immutable After Posting")
    ).not.toBeInTheDocument();
  });

  it("supports info variant", () => {
    const { container } = renderWithTheme(
      <ImmutabilityBanner text="Info." variant="info" />
    );
    expect(container.innerHTML).toContain("blue");
  });

  it("supports warning variant", () => {
    const { container } = renderWithTheme(
      <ImmutabilityBanner text="Warning." variant="warning" />
    );
    expect(container.innerHTML).toContain("amber");
  });

  it("supports success variant", () => {
    const { container } = renderWithTheme(
      <ImmutabilityBanner text="Success." variant="success" />
    );
    expect(container.innerHTML).toContain("emerald");
  });
});
