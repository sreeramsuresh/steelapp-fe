import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ConfigurableTable from "../ConfigurableTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "price", label: "Price", align: "right" },
];

const data = [
  { id: 1, name: "Steel Rod", price: 100 },
  { id: 2, name: "Steel Sheet", price: 200 },
];

describe("ConfigurableTable", () => {
  it("renders column headers", () => {
    render(<ConfigurableTable columns={columns} data={data} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<ConfigurableTable columns={columns} data={data} />);
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<ConfigurableTable columns={columns} data={[]} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows default empty state when no data", () => {
    render(<ConfigurableTable columns={columns} data={[]} />);
    expect(screen.getByText("No records found")).toBeInTheDocument();
  });

  it("shows custom empty state", () => {
    render(<ConfigurableTable columns={columns} data={[]} emptyState={<p>Nothing here</p>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<ConfigurableTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Steel Rod"));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("renders custom column renderer", () => {
    const customColumns = [
      {
        key: "name",
        label: "Name",
        render: (row) => <strong data-testid="custom">{row.name}</strong>,
      },
    ];
    render(<ConfigurableTable columns={customColumns} data={data} />);
    expect(screen.getAllByTestId("custom")).toHaveLength(2);
  });

  it("renders footer content", () => {
    render(<ConfigurableTable columns={columns} data={data} footer={<div>Page 1 of 2</div>} />);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });
});
