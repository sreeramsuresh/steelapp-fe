import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import BasePriceRow from "../BasePriceRow";

function renderWithTheme(ui) {
  return render(
    <ThemeProvider>
      <table>
        <tbody>{ui}</tbody>
      </table>
    </ThemeProvider>
  );
}

const baseItem = {
  productId: 101,
  sellingPrice: 250.5,
  updatedAt: "2025-06-15T10:00:00Z",
  product: {
    name: "Steel Rod 12mm",
    grade: "Fe500D",
    formType: "TMT Bar",
  },
};

describe("BasePriceRow", () => {
  it("renders product name and ID", () => {
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={vi.fn()}
        isEditing={false}
        onStartEdit={vi.fn()}
      />
    );
    expect(screen.getByText("Steel Rod 12mm")).toBeInTheDocument();
    expect(screen.getByText("ID: 101")).toBeInTheDocument();
  });

  it("renders grade and form type", () => {
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={vi.fn()}
        isEditing={false}
        onStartEdit={vi.fn()}
      />
    );
    expect(screen.getByText("Fe500D")).toBeInTheDocument();
    expect(screen.getByText("TMT Bar")).toBeInTheDocument();
  });

  it("displays price as clickable button when not editing", () => {
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={vi.fn()}
        isEditing={false}
        onStartEdit={vi.fn()}
      />
    );
    expect(screen.getByText("AED 250.50")).toBeInTheDocument();
  });

  it("calls onStartEdit when price button clicked", () => {
    const onStartEdit = vi.fn();
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={vi.fn()}
        isEditing={false}
        onStartEdit={onStartEdit}
      />
    );
    screen.getByText("AED 250.50").click();
    expect(onStartEdit).toHaveBeenCalledTimes(1);
  });

  it("shows input field when editing", () => {
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={vi.fn()}
        isEditing={true}
        editingPrice={300}
        onPriceChange={vi.fn()}
        onSavePrice={vi.fn()}
        onCancelEdit={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
    expect(screen.getByTitle("Save")).toBeInTheDocument();
    expect(screen.getByTitle("Cancel")).toBeInTheDocument();
  });

  it("toggles checkbox selection", () => {
    const onToggle = vi.fn();
    renderWithTheme(
      <BasePriceRow
        item={baseItem}
        isSelected={false}
        onToggleSelect={onToggle}
        isEditing={false}
        onStartEdit={vi.fn()}
      />
    );
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
