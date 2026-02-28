import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ScenarioCards from "../ScenarioCards";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ScenarioCards", () => {
  it("returns null when no scenarios", () => {
    const { container } = renderWithTheme(<ScenarioCards scenarios={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders scenario title and description", () => {
    renderWithTheme(
      <ScenarioCards
        scenarios={[
          {
            title: "Wrong Amount",
            description: "Invoice has incorrect total",
          },
        ]}
      />
    );
    expect(screen.getByText("Wrong Amount")).toBeInTheDocument();
    expect(screen.getByText("Invoice has incorrect total")).toBeInTheDocument();
  });

  it("renders mini flow steps", () => {
    renderWithTheme(
      <ScenarioCards
        scenarios={[
          {
            title: "Credit Flow",
            description: "Standard credit note",
            flow: [
              { label: "INV-001", type: "invoice" },
              { label: "CN-001", type: "credit_note" },
            ],
          },
        ]}
      />
    );
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("CN-001")).toBeInTheDocument();
  });

  it("renders multiple scenarios", () => {
    renderWithTheme(
      <ScenarioCards
        scenarios={[
          { title: "Scenario A", description: "Desc A" },
          { title: "Scenario B", description: "Desc B" },
        ]}
      />
    );
    expect(screen.getByText("Scenario A")).toBeInTheDocument();
    expect(screen.getByText("Scenario B")).toBeInTheDocument();
  });
});
