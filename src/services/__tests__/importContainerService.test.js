/**
 * Import Container Service Unit Tests
 * Tests container tracking and shipment management
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from "../api";
import importContainerService from "../importContainerService";

describe("importContainerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getContainers", () => {
    test("should fetch containers", async () => {
      const mockResponse = {
        data: [{ id: 1, containerNumber: "CNT-001", status: "IN_TRANSIT", importOrderId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importContainerService.getContainers({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].containerNumber).toBe("CNT-001");
    });

    test("should filter by status", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await importContainerService.getContainers({ status: "ARRIVED" });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getContainer", () => {
    test("should fetch container details", async () => {
      const mockResponse = {
        id: 1,
        containerNumber: "CNT-001",
        type: "20FT",
        status: "IN_TRANSIT",
        items: [{ productId: 1, quantity: 100 }],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(result.type).toBe("20FT");
      expect(result.items).toBeDefined();
    });
  });

  describe("updateContainer", () => {
    test("should update container status", async () => {
      const updateData = { status: "ARRIVED" };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      const result = await importContainerService.updateContainer(1, updateData);

      expect(result.status).toBe("ARRIVED");
    });
  });

  describe("Container Types", () => {
    test("should support 20FT and 40FT containers", async () => {
      const mockResponse = { id: 1, type: "20FT" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(["20FT", "40FT"]).toContain(result.type);
    });
  });

  describe("Error Handling", () => {
    test("should handle errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Error"));

      await expect(importContainerService.getContainers()).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty container", async () => {
      const mockResponse = { id: 1, items: [] };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(result.items).toEqual([]);
    });
  });
});
