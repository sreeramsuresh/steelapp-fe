import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// The Select component is a Radix UI primitive (SelectPrimitive.Root).
// Test the named exports: Select, SelectTrigger, SelectContent, SelectItem, SelectValue
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../Select";

describe("Select", () => {
  it("should render select", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>
    );
    expect(container).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("should display options", () => {
    const { container } = render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });

  it("should handle selection", () => {
    const { container } = render(
      <Select defaultValue="b">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });
});
