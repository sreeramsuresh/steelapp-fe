import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import Breadcrumb from "../Breadcrumb";

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("Breadcrumb", () => {
  it("returns null when no items", () => {
    const { container } = renderWithProviders(<Breadcrumb items={[]} />);
    expect(container.querySelector("nav")).not.toBeInTheDocument();
  });

  it("renders breadcrumb items", () => {
    renderWithProviders(
      <Breadcrumb
        items={[
          { label: "Invoices", href: "/invoices" },
          { label: "INV-001", current: true },
        ]}
      />
    );
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
  });

  it("marks current item with aria-current", () => {
    renderWithProviders(<Breadcrumb items={[{ label: "Current Page", current: true }]} />);
    expect(screen.getByText("Current Page")).toHaveAttribute("aria-current", "page");
  });

  it("renders links for non-current items", () => {
    renderWithProviders(<Breadcrumb items={[{ label: "Invoices", href: "/invoices" }]} />);
    const link = screen.getByText("Invoices");
    expect(link.tagName).toBe("A");
  });

  it("has aria-label for navigation", () => {
    renderWithProviders(<Breadcrumb items={[{ label: "Page", current: true }]} />);
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });
});
