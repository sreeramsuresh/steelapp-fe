/**
 * ResponsiveTable Component Tests
 * Tests responsive table wrapper with horizontal scroll indicator
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResponsiveTable from "../ResponsiveTable";

describe("ResponsiveTable", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ResponsiveTable>
        <table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      </ResponsiveTable>
    );
    expect(container).toBeTruthy();
  });

  it("renders children content", () => {
    render(
      <ResponsiveTable>
        <table>
          <tbody>
            <tr>
              <td>Test Cell</td>
            </tr>
          </tbody>
        </table>
      </ResponsiveTable>
    );
    expect(screen.getByText("Test Cell")).toBeInTheDocument();
  });

  it("renders scroll hint text", () => {
    render(
      <ResponsiveTable>
        <table />
      </ResponsiveTable>
    );
    expect(screen.getByText(/Scroll right for more/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ResponsiveTable className="custom-class">
        <table />
      </ResponsiveTable>
    );
    expect(container.firstChild.className).toContain("custom-class");
  });

  it("has overflow-x-auto for horizontal scrolling", () => {
    const { container } = render(
      <ResponsiveTable>
        <table />
      </ResponsiveTable>
    );
    expect(container.firstChild.className).toContain("overflow-x-auto");
  });
});
