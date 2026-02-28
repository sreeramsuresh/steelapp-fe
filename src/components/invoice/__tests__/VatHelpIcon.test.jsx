import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  Info: (props) => <span data-testid="info-icon" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import VatHelpIcon from "../VatHelpIcon";

describe("VatHelpIcon", () => {
  it("renders info button", () => {
    render(<VatHelpIcon content="Help text" />);
    expect(screen.getByTitle("Click for help")).toBeTruthy();
  });

  it("does not show modal initially", () => {
    render(<VatHelpIcon content="Help text" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows modal when info button is clicked", () => {
    render(<VatHelpIcon content="Help text here" />);
    fireEvent.click(screen.getByTitle("Click for help"));
    expect(screen.getByText("Help text here")).toBeTruthy();
  });

  it("shows heading in modal when provided", () => {
    render(<VatHelpIcon content="Body text" heading="My Heading" />);
    fireEvent.click(screen.getByTitle("Click for help"));
    expect(screen.getByText("My Heading")).toBeTruthy();
  });

  it("renders array content as multiple paragraphs", () => {
    const content = ["First paragraph", "Second paragraph"];
    render(<VatHelpIcon content={content} />);
    fireEvent.click(screen.getByTitle("Click for help"));
    expect(screen.getByText("First paragraph")).toBeTruthy();
    expect(screen.getByText("Second paragraph")).toBeTruthy();
  });

  it("closes modal when X button is clicked", () => {
    render(<VatHelpIcon content="Help text" />);
    fireEvent.click(screen.getByTitle("Click for help"));
    expect(screen.getByText("Help text")).toBeTruthy();
    // Click the close X button inside the modal
    const closeButtons = screen.getAllByRole("button");
    const closeBtn = closeButtons.find((btn) => btn.querySelector("[data-testid='x-icon']"));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(screen.queryByText("Help text")).toBeNull();
  });
});
