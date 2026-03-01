/**
 * Transit Service Unit Tests (Node Native Test Runner)
 * Tests shipment tracking and transit status management
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";
import { transitService } from "../transitService.js";

describe("transitService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all items in transit", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            type: "shipment",
            origin: "Shanghai",
            destination: "Dubai",
            status: "in_transit",
          },
        ],
      };

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await transitService.getAll({ page: 1 });

      expect(result.data).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/transit", expect.anything());
    });

    it("should support parameters", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      await transitService.getAll({ page: 2, limit: 50 });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe("getTracking", () => {
    it("should fetch transit tracking for specific item", async () => {
      const mockResponse = {
        id: 1,
        type: "shipment",
        status: "in_transit",
        location: "Port of Singapore",
        expected_arrival: "2024-01-20",
      };

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await transitService.getTracking("shipment", 1);

      expect(result.status).toBe("in_transit");
      expect(apiClient.get).toHaveBeenCalledWith("/transit/shipment/1");
    });

    it("should handle different item types", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ status: "in_transit" });

      await transitService.getTracking("purchase_order", 5);

      expect(apiClient.get).toHaveBeenCalledWith("/transit/purchase_order/5");
    });
  });

  describe("updateStatus", () => {
    it("should update transit status", async () => {
      const mockResponse = {
        id: 1,
        type: "shipment",
        status: "arrived",
        updated_at: "2024-01-20T10:00:00Z",
      };

      vi.spyOn(apiClient, "patch").mockResolvedValue(mockResponse);

      const result = await transitService.updateStatus("shipment", 1, "arrived");

      expect(result.status).toBe("arrived");
      expect(apiClient.patch).toHaveBeenCalledWith("/transit/shipment/1/status", { status: "arrived" });
    });

    it("should handle status changes", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValue({ status: "in_transit" });

      await transitService.updateStatus("invoice", 2, "in_transit");

      expect(apiClient.patch).toHaveBeenCalledWith("/transit/invoice/2/status", expect.anything());
    });
  });
});
