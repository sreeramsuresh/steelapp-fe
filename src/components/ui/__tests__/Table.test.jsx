/**
 * Table Component Tests
 * Tests table primitives (Table, TableHeader, TableBody, TableRow, etc.)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../table";

describe("Table", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(container).toBeTruthy();
  });

  it("renders table with content", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Steel Plate</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Steel Plate")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders TableCaption", () => {
    render(
      <Table>
        <TableCaption>Product List</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Item</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("Product List")).toBeInTheDocument();
  });

  it("renders TableFooter", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("applies custom className to Table", () => {
    const { container } = render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const table = container.querySelector("table");
    expect(table.className).toContain("custom-table");
  });

  it("applies custom className to TableRow", () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow className="highlight-row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = container.querySelector("tr");
    expect(row.className).toContain("highlight-row");
  });

  it("exports all expected components", () => {
    expect(Table).toBeDefined();
    expect(TableHeader).toBeDefined();
    expect(TableBody).toBeDefined();
    expect(TableFooter).toBeDefined();
    expect(TableHead).toBeDefined();
    expect(TableRow).toBeDefined();
    expect(TableCell).toBeDefined();
    expect(TableCaption).toBeDefined();
  });
});
