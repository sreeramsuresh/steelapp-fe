import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Phone: (props) => <svg {...props} />,
  X: (props) => <svg {...props} />,
  XCircle: (props) => <svg {...props} />,
}));

import OrderBlockingLogic from "../OrderBlockingLogic";

const blockedCustomer = {
  name: "ABC Trading LLC",
  creditGrade: "D",
  daysSinceLastPayment: 75,
  dsoThreshold: 90,
  overdueAmount: 15000,
};

describe("OrderBlockingLogic", () => {
  it("returns null when not open", () => {
    const { container } = render(<OrderBlockingLogic customer={blockedCustomer} isOpen={false} onClose={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when customer is null", () => {
    const { container } = render(<OrderBlockingLogic customer={null} isOpen={true} onClose={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when customer is not blocked (grade A)", () => {
    const goodCustomer = { ...blockedCustomer, creditGrade: "A" };
    const { container } = render(<OrderBlockingLogic customer={goodCustomer} isOpen={true} onClose={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders modal for blocked customer (grade D)", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Order Blocked")).toBeInTheDocument();
  });

  it("renders modal for grade E customer", () => {
    const gradeE = { ...blockedCustomer, creditGrade: "E" };
    render(<OrderBlockingLogic customer={gradeE} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Order Blocked")).toBeInTheDocument();
  });

  it("displays customer name", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("ABC Trading LLC")).toBeInTheDocument();
  });

  it("shows overdue amount", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/15000\.00/)).toBeInTheDocument();
  });

  it("renders manager approval button", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Manager Approval - Create Order")).toBeInTheDocument();
  });

  it("renders contact finance button", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Contact Finance Team")).toBeInTheDocument();
  });

  it("renders cancel order button", () => {
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Cancel Order")).toBeInTheDocument();
  });

  it("calls onClose when cancel order is clicked", () => {
    const onClose = vi.fn();
    render(<OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows confirmation view when manager approval is clicked", () => {
    render(
      <OrderBlockingLogic customer={blockedCustomer} isOpen={true} onClose={() => {}} onApproveOverride={() => {}} />
    );
    fireEvent.click(screen.getByText("Manager Approval - Create Order"));
    expect(screen.getByText("Confirm & Create Order")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("calls onContactFinance and closes when contact finance is clicked", () => {
    const onContactFinance = vi.fn();
    const onClose = vi.fn();
    render(
      <OrderBlockingLogic
        customer={blockedCustomer}
        isOpen={true}
        onClose={onClose}
        onContactFinance={onContactFinance}
      />
    );
    fireEvent.click(screen.getByText("Contact Finance Team"));
    expect(onContactFinance).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
