import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass("inline-flex");
  });

  it("applies custom className", () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders with destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstChild.className).toContain("destructive");
  });

  it("renders with outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild.className).toContain("text-foreground");
  });

  it("renders with success variant", () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild.className).toContain("bg-green-500");
  });

  it("renders with warning variant", () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    expect(container.firstChild.className).toContain("bg-yellow-500");
  });
});
