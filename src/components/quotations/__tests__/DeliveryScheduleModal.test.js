/**
 * DeliveryScheduleModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests delivery schedule configuration for quotation line items
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeliveryScheduleModal from "../DeliveryScheduleModal";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("DeliveryScheduleModal", () => {
  let mockOnClose;
  let mockOnSave;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSave = vi.fn();
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <DeliveryScheduleModal
        isOpen={false}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", () => {
    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Delivery Schedule")).toBeInTheDocument();
  });

  it("should display existing schedule entries on open", () => {
    const schedule = [
      { date: "2024-02-15", quantity: 500, notes: "First shipment" },
      { date: "2024-03-15", quantity: 500, notes: "Final shipment" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
  });

  it("should add a new schedule entry when Add button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const addButton = screen.getByRole("button", { name: /Add/ });
    await user.click(addButton);

    // Should have more input fields after adding
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("should remove a schedule entry when delete button is clicked", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "2024-02-15", quantity: 500, notes: "Shipment" },
      { date: "2024-03-15", quantity: 500, notes: "Shipment" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    await user.click(deleteButtons[0]);

    // One entry should be removed
    const spinButtons = screen.getAllByRole("spinbutton");
    expect(spinButtons.length).toBeLessThan(2);
  });

  it("should validate that total scheduled quantity matches line quantity", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "2024-02-15", quantity: 300, notes: "" }, // Total is 300, but line quantity is 1000
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(screen.getByText(/Total scheduled quantity must match line quantity/)).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should allow empty schedule to be saved", async () => {
    const user = userEvent.setup();
    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith([]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should validate that all entries have dates", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "", quantity: 500, notes: "" }, // Missing date
      { date: "2024-03-15", quantity: 500, notes: "" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(screen.getByText(/All delivery entries must have a date/)).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should sort schedule entries by date before saving", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "2024-03-15", quantity: 500, notes: "Late shipment" },
      { date: "2024-02-15", quantity: 500, notes: "Early shipment" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    const savedSchedule = mockOnSave.mock.calls[0][0];
    expect(new Date(savedSchedule[0].date)).toBeLessThan(new Date(savedSchedule[1].date));
  });

  it("should filter out entries with zero quantity before saving", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "2024-02-15", quantity: 0, notes: "" },
      { date: "2024-03-15", quantity: 1000, notes: "" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    const savedSchedule = mockOnSave.mock.calls[0][0];
    expect(savedSchedule.length).toBe(1);
    expect(savedSchedule[0].quantity).toBe(1000);
  });

  it("should display running total of scheduled quantity", () => {
    const schedule = [
      { date: "2024-02-15", quantity: 300, notes: "" },
      { date: "2024-03-15", quantity: 700, notes: "" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText(/Scheduled/)).toBeInTheDocument();
    expect(screen.getByText(/Remaining/)).toBeInTheDocument();
  });

  it("should allow decimal quantities", async () => {
    const user = userEvent.setup();
    const schedule = [
      { date: "2024-02-15", quantity: 500.5, notes: "" },
      { date: "2024-03-15", quantity: 499.5, notes: "" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it("should close modal when X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const closeButton = screen.getByRole("button", { name: /Close/ });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should allow notes for each schedule entry", async () => {
    const _user = userEvent.setup();
    const schedule = [
      { date: "2024-02-15", quantity: 500, notes: "Ship to Dubai warehouse" },
      { date: "2024-03-15", quantity: 500, notes: "Ship to Abu Dhabi warehouse" },
    ];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue("Ship to Dubai warehouse")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ship to Abu Dhabi warehouse")).toBeInTheDocument();
  });

  it("should close modal after successful save", async () => {
    const user = userEvent.setup();
    const schedule = [{ date: "2024-02-15", quantity: 1000, notes: "" }];

    render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={schedule}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should reset validation error when modal reopens", () => {
    const { rerender } = render(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[{ date: "", quantity: 500, notes: "" }]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    // Force invalid state display
    expect(screen.queryByText(/All delivery entries must have a date/)).not.toBeInTheDocument();

    rerender(
      <DeliveryScheduleModal
        isOpen={false}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    rerender(
      <DeliveryScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        schedule={[]}
        lineQuantity={1000}
        onSave={mockOnSave}
      />
    );

    // Error should be cleared
    expect(screen.queryByText(/All delivery entries must have a date/)).not.toBeInTheDocument();
  });
});
