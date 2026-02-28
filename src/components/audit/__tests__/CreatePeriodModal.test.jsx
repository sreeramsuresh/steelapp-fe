import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import CreatePeriodModal from "../CreatePeriodModal";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe("CreatePeriodModal", () => {
  it("returns null when not open", () => {
    const { container } = render(
      <CreatePeriodModal
        isOpen={false}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal when open", () => {
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
      />
    );
    expect(screen.getByText("Create New Period")).toBeInTheDocument();
  });

  it("shows period type, year, and month fields", () => {
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Period Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
  });

  it("hides month field for non-MONTHLY types", () => {
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("Period Type"), {
      target: { value: "YEARLY" },
    });
    expect(screen.queryByLabelText("Month")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel clicked", () => {
    const onClose = vi.fn();
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={onClose}
        onCreatePeriod={vi.fn()}
      />
    );
    screen.getByText("Cancel").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Creating... when isLoading", () => {
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
        isLoading={true}
      />
    );
    expect(screen.getByText("Creating...")).toBeInTheDocument();
  });

  it("has all 12 month options", () => {
    render(
      <CreatePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onCreatePeriod={vi.fn()}
      />
    );
    expect(screen.getByRole("option", { name: "January" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "December" })).toBeInTheDocument();
  });
});
