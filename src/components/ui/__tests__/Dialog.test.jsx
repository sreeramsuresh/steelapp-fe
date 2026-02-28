/**
 * Dialog Component Tests
 * Tests Radix UI Dialog primitives wrapper
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

describe("Dialog", () => {
  it("renders Dialog trigger", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );
    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
  });

  it("renders DialogHeader with children", () => {
    render(<DialogHeader>Header Content</DialogHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("renders DialogFooter with children", () => {
    render(<DialogFooter>Footer Content</DialogFooter>);
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("renders DialogHeader with custom className", () => {
    const { container } = render(<DialogHeader className="custom-header">Header</DialogHeader>);
    expect(container.firstChild.className).toContain("custom-header");
  });

  it("renders DialogFooter with custom className", () => {
    const { container } = render(<DialogFooter className="custom-footer">Footer</DialogFooter>);
    expect(container.firstChild.className).toContain("custom-footer");
  });

  it("exports all expected components", () => {
    expect(Dialog).toBeDefined();
    expect(DialogTrigger).toBeDefined();
    expect(DialogContent).toBeDefined();
    expect(DialogHeader).toBeDefined();
    expect(DialogFooter).toBeDefined();
    expect(DialogTitle).toBeDefined();
    expect(DialogDescription).toBeDefined();
  });
});
