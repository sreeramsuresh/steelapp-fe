import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  Calendar: (props) => <span data-testid="calendar-icon" {...props} />,
  Plus: (props) => <span data-testid="plus-icon" {...props} />,
  Trash2: (props) => <span data-testid="trash-icon" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import DeliveryScheduleModal from "../DeliveryScheduleModal";

describe("DeliveryScheduleModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    schedule: [],
    lineQuantity: 100,
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(<DeliveryScheduleModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText("Delivery Schedule")).toBeTruthy();
  });

  it("shows line quantity in subtitle", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText(/Plan phased deliveries for line quantity: 100 units/)).toBeTruthy();
  });

  it("shows Add Delivery Date button", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText("Add Delivery Date")).toBeTruthy();
  });

  it("adds a new entry when Add button is clicked", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Delivery Date"));
    // Should show delivery date input label
    expect(screen.getByText("Delivery Date *")).toBeTruthy();
  });

  it("shows Save Schedule and Cancel buttons", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText("Save Schedule")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave with empty schedule when no entries", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Schedule"));
    expect(defaultProps.onSave).toHaveBeenCalledWith([]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows requirements section", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText("Requirements:")).toBeTruthy();
  });

  it("shows progress summary", () => {
    render(<DeliveryScheduleModal {...defaultProps} />);
    expect(screen.getByText("Line Quantity:")).toBeTruthy();
    expect(screen.getByText("Total Scheduled:")).toBeTruthy();
    expect(screen.getByText("Remaining:")).toBeTruthy();
  });
});
