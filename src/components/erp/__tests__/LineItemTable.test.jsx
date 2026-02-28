import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  Plus: (props) => <svg data-testid="plus-icon" {...props} />,
  Trash2: (props) => <svg data-testid="trash-icon" {...props} />,
}));

import LineItemTable from "../LineItemTable";

const columns = [
  { key: "product", label: "Product", width: "40%", render: (item) => item.product },
  { key: "qty", label: "Qty", width: "20%", render: (item) => item.qty },
  { key: "price", label: "Price", width: "20%", align: "right", render: (item) => item.price },
];

const items = [
  { id: 1, product: "Steel Rod", qty: 10, price: 100 },
  { id: 2, product: "Steel Sheet", qty: 5, price: 200 },
];

describe("LineItemTable", () => {
  it("renders column headers", () => {
    render(
      <LineItemTable columns={columns} items={items} onAddItem={() => {}} onRemoveItem={() => {}} />
    );
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Qty")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
  });

  it("renders item rows", () => {
    render(
      <LineItemTable columns={columns} items={items} onAddItem={() => {}} onRemoveItem={() => {}} />
    );
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
  });

  it("renders add item button with default label", () => {
    render(
      <LineItemTable columns={columns} items={items} onAddItem={() => {}} onRemoveItem={() => {}} />
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("renders add item button with custom label", () => {
    render(
      <LineItemTable
        columns={columns}
        items={items}
        onAddItem={() => {}}
        onRemoveItem={() => {}}
        addLabel="Add Line"
      />
    );
    expect(screen.getByText("Add Line")).toBeInTheDocument();
  });

  it("calls onAddItem when add button is clicked", () => {
    const onAddItem = vi.fn();
    render(
      <LineItemTable columns={columns} items={items} onAddItem={onAddItem} onRemoveItem={() => {}} />
    );
    fireEvent.click(screen.getByText("Add Item"));
    expect(onAddItem).toHaveBeenCalledTimes(1);
  });

  it("calls onRemoveItem when remove button is clicked", () => {
    const onRemoveItem = vi.fn();
    render(
      <LineItemTable columns={columns} items={items} onAddItem={() => {}} onRemoveItem={onRemoveItem} />
    );
    const removeButtons = screen.getAllByTitle("Remove item");
    fireEvent.click(removeButtons[0]);
    expect(onRemoveItem).toHaveBeenCalledWith(0);
  });

  it("hides add and remove buttons in readOnly mode", () => {
    render(
      <LineItemTable columns={columns} items={items} onAddItem={() => {}} onRemoveItem={() => {}} readOnly />
    );
    expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Remove item")).not.toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <LineItemTable
        columns={columns}
        items={items}
        onAddItem={() => {}}
        onRemoveItem={() => {}}
        footer={<div>Total: 1500</div>}
      />
    );
    expect(screen.getByText("Total: 1500")).toBeInTheDocument();
  });
});
