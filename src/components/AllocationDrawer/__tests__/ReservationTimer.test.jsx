/**
 * ReservationTimer Component Tests
 *
 * Tests countdown timer for batch reservation expiry
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ReservationTimer from "../ReservationTimer";

describe("ReservationTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should not render when no expiresAt is provided", () => {
      const { container } = render(<ReservationTimer />);
      expect(container.querySelector(".reservation-timer")).toBeNull();
    });

    it("should render timer when expiresAt is provided", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { container } = render(<ReservationTimer expiresAt={futureTime} />);
      expect(container.querySelector(".reservation-timer")).toBeTruthy();
    });

    it("should display remaining text", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      render(<ReservationTimer expiresAt={futureTime} />);
      expect(screen.getByText("remaining")).toBeInTheDocument();
    });

    it("should display Reservation active for normal timer state", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      render(<ReservationTimer expiresAt={futureTime} />);
      expect(screen.getByText("Reservation active")).toBeInTheDocument();
    });
  });

  describe("Timer States", () => {
    it("should show warning state when time is below warning threshold", () => {
      const futureTime = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 min
      const { container } = render(<ReservationTimer expiresAt={futureTime} />);
      expect(container.querySelector(".timer-warning")).toBeTruthy();
    });

    it("should show critical state when time is below critical threshold", () => {
      const futureTime = new Date(Date.now() + 30 * 1000).toISOString(); // 30 sec
      const { container } = render(<ReservationTimer expiresAt={futureTime} />);
      expect(container.querySelector(".timer-critical")).toBeTruthy();
    });

    it("should display Time running low for warning state", () => {
      const futureTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      render(<ReservationTimer expiresAt={futureTime} />);
      expect(screen.getByText("Time running low")).toBeInTheDocument();
    });

    it("should display Expiring soon! for critical state", () => {
      const futureTime = new Date(Date.now() + 30 * 1000).toISOString();
      render(<ReservationTimer expiresAt={futureTime} />);
      expect(screen.getByText("Expiring soon!")).toBeInTheDocument();
    });
  });

  describe("Extend Button", () => {
    it("should show extend button when onExtend is provided", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      render(
        <ReservationTimer expiresAt={futureTime} onExtend={vi.fn()} />,
      );
      expect(screen.getByText("+30m")).toBeInTheDocument();
    });

    it("should not show extend button when onExtend is not provided", () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      render(<ReservationTimer expiresAt={futureTime} />);
      expect(screen.queryByText("+30m")).not.toBeInTheDocument();
    });

    it("should call onExtend when extend button is clicked", async () => {
      vi.useRealTimers(); // need real timers for userEvent
      const mockExtend = vi.fn().mockResolvedValue(undefined);
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const user = userEvent.setup();

      render(
        <ReservationTimer expiresAt={futureTime} onExtend={mockExtend} />,
      );

      await user.click(screen.getByText("+30m"));

      await waitFor(() => {
        expect(mockExtend).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Expiry Callback", () => {
    it("should call onExpired when timer reaches zero", () => {
      const mockExpired = vi.fn();
      // Set expiry to 2 seconds from now
      const futureTime = new Date(Date.now() + 2000).toISOString();

      render(
        <ReservationTimer expiresAt={futureTime} onExpired={mockExpired} />,
      );

      // Advance timer past expiry
      vi.advanceTimersByTime(3000);

      expect(mockExpired).toHaveBeenCalled();
    });
  });
});
