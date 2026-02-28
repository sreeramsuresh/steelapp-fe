/**
 * WarehouseFormDialog Component Tests
 * Tests modal dialog for creating/editing warehouse details
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import WarehouseFormDialog from "../WarehouseFormDialog";

describe("WarehouseFormDialog", () => {
  const defaultProps = {
    open: true,
    warehouse: null,
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders nothing when open is false", () => {
    const { container } = render(<WarehouseFormDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when open", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Add New Warehouse")).toBeInTheDocument();
  });

  it("shows Edit Warehouse title when editing", () => {
    const warehouse = { name: "Test WH", code: "WH-01", city: "Dubai" };
    render(<WarehouseFormDialog {...defaultProps} warehouse={warehouse} />);
    expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
  });

  it("renders form fields", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Code *")).toBeInTheDocument();
    expect(screen.getByLabelText("City *")).toBeInTheDocument();
  });

  it("renders Basic Information section", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
  });

  it("renders Location section", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("renders Contact Information section", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
  });

  it("renders Capacity & Status section", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Capacity & Status")).toBeInTheDocument();
  });

  it("renders Cancel and Create buttons", () => {
    render(<WarehouseFormDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create Warehouse")).toBeInTheDocument();
  });

  it("renders Update button when editing", () => {
    const warehouse = { name: "Test", code: "WH-01", city: "Dubai" };
    render(<WarehouseFormDialog {...defaultProps} warehouse={warehouse} />);
    expect(screen.getByText("Update Warehouse")).toBeInTheDocument();
  });

  it("populates form with warehouse data when editing", () => {
    const warehouse = {
      name: "Main WH",
      code: "WH-MAIN",
      city: "Dubai",
      country: "UAE",
    };
    render(<WarehouseFormDialog {...defaultProps} warehouse={warehouse} />);
    expect(screen.getByDisplayValue("Main WH")).toBeInTheDocument();
    expect(screen.getByDisplayValue("WH-MAIN")).toBeInTheDocument();
  });
});
