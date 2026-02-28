import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";

describe("Card components", () => {
  it("renders Card with children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies custom className to Card", () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("renders CardHeader", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders CardTitle as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText("Title");
    expect(title.tagName).toBe("H3");
  });

  it("renders CardDescription as p", () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen.getByText("Description");
    expect(desc.tagName).toBe("P");
  });

  it("renders CardContent", () => {
    render(<CardContent>Body</CardContent>);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders full card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
          <CardDescription>My description</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
        <CardFooter>Footer here</CardFooter>
      </Card>
    );
    expect(screen.getByText("My Card")).toBeInTheDocument();
    expect(screen.getByText("My description")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
    expect(screen.getByText("Footer here")).toBeInTheDocument();
  });
});
