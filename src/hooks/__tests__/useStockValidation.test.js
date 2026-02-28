import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStockValidation } from "../useStockValidation";

const mockGetAllItems = vi.fn();

vi.mock("../../services/inventoryService", () => ({
  inventoryService: {
    getAllItems: (...args) => mockGetAllItems(...args),
  },
}));

describe("useStockValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useStockValidation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.checkAvailability).toBe("function");
    expect(typeof result.current.validateUomCompatibility).toBe("function");
    expect(typeof result.current.getConversionPreview).toBe("function");
    expect(typeof result.current.getShortfallWarning).toBe("function");
  });

  describe("checkAvailability", () => {
    it("returns unavailable when no items found", async () => {
      mockGetAllItems.mockResolvedValue({ data: [] });
      const { result } = renderHook(() => useStockValidation());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability(1, 1, 100, "KG");
      });

      expect(availability.available).toBe(false);
      expect(availability.quantityAvailable).toBe(0);
      expect(availability.shortfall).toBe(100);
    });

    it("returns available when sufficient stock", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ quantityAvailable: 200 }],
      });
      const { result } = renderHook(() => useStockValidation());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability(1, 1, 100, "KG");
      });

      expect(availability.available).toBe(true);
      expect(availability.quantityAvailable).toBe(200);
      expect(availability.shortfall).toBe(0);
    });

    it("returns shortfall when insufficient stock", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ quantityAvailable: 50 }],
      });
      const { result } = renderHook(() => useStockValidation());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability(1, 1, 100, "KG");
      });

      expect(availability.available).toBe(false);
      expect(availability.shortfall).toBe(50);
    });

    it("handles API errors gracefully", async () => {
      mockGetAllItems.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useStockValidation());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability(1, 1, 100, "KG");
      });

      expect(availability.available).toBe(false);
      expect(availability.message).toBe("Error checking availability");
      expect(result.current.error).toBe("Network error");
    });

    it("aggregates quantities from multiple items", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [
          { quantityAvailable: 30 },
          { quantityAvailable: 40 },
          { quantityAvailable: 50 },
        ],
      });
      const { result } = renderHook(() => useStockValidation());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability(1, 1, 100, "KG");
      });

      expect(availability.available).toBe(true);
      expect(availability.quantityAvailable).toBe(120);
    });
  });

  describe("validateUomCompatibility", () => {
    it("returns compatible for same weight units", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ unit: "KG" }],
      });
      const { result } = renderHook(() => useStockValidation());

      let compat;
      await act(async () => {
        compat = await result.current.validateUomCompatibility(1, "MT");
      });

      expect(compat.compatible).toBe(true);
    });

    it("returns incompatible for different unit families", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ unit: "KG" }],
      });
      const { result } = renderHook(() => useStockValidation());

      let compat;
      await act(async () => {
        compat = await result.current.validateUomCompatibility(1, "PCS");
      });

      expect(compat.compatible).toBe(false);
      expect(compat.stockUnit).toBe("KG");
    });

    it("returns incompatible when no items", async () => {
      mockGetAllItems.mockResolvedValue({ data: [] });
      const { result } = renderHook(() => useStockValidation());

      let compat;
      await act(async () => {
        compat = await result.current.validateUomCompatibility(1, "KG");
      });

      expect(compat.compatible).toBe(false);
      expect(compat.stockUnit).toBeNull();
    });
  });

  describe("getShortfallWarning", () => {
    it("returns null when sufficient stock", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ quantityAvailable: 200 }],
      });
      const { result } = renderHook(() => useStockValidation());

      let warning;
      await act(async () => {
        warning = await result.current.getShortfallWarning(1, 1, 100);
      });

      expect(warning).toBeNull();
    });

    it("returns warning message when insufficient stock", async () => {
      mockGetAllItems.mockResolvedValue({
        data: [{ quantityAvailable: 50 }],
      });
      const { result } = renderHook(() => useStockValidation());

      let warning;
      await act(async () => {
        warning = await result.current.getShortfallWarning(1, 1, 100);
      });

      expect(warning).toContain("shortfall");
      expect(warning).toContain("50");
    });
  });
});
