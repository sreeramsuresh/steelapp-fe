import { beforeEach, describe, expect, it, vi } from "vitest";
import { transitService } from "../transitService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("transitService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInTransitShipments", () => {
    it("should fetch all in-transit shipments", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            shipment_id: "SHP-001",
            origin_port: "Shanghai",
            destination_port: "Jebel Ali",
            departure_date: "2024-01-10",
            expected_arrival: "2024-01-20",
            status: "in_transit",
          },
        ],
        pagination: { total: 1, page: 1 },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await transitService.getInTransitShipments();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe("in_transit");
    });
  });

  describe("getShipmentTracking", () => {
    it("should fetch shipment tracking details with milestones", async () => {
      const mockResponse = {
        id: 1,
        shipment_id: "SHP-001",
        current_location: "Port of Singapore",
        current_status: "in_transit",
        milestones: [
          {
            date: "2024-01-10T08:00:00Z",
            location: "Shanghai Port",
            event: "Container Loaded",
          },
          {
            date: "2024-01-15T12:00:00Z",
            location: "Singapore Strait",
            event: "In Transit",
          },
        ],
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await transitService.getShipmentTracking("SHP-001");

      expect(result.milestones).toHaveLength(2);
      expect(result.current_status).toBe("in_transit");
      expect(api.get).toHaveBeenCalledWith("/transit/SHP-001/tracking");
    });
  });

  describe("updateShipmentLocation", () => {
    it("should update shipment current location and status", async () => {
      const mockResponse = {
        id: 1,
        shipment_id: "SHP-001",
        current_location: "Port of Jebel Ali",
        status: "arrived",
        last_updated: "2024-01-20T10:00:00Z",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        location: "Port of Jebel Ali",
        status: "arrived",
        timestamp: "2024-01-20T10:00:00Z",
      };

      const result = await transitService.updateShipmentLocation(
        "SHP-001",
        payload
      );

      expect(result.status).toBe("arrived");
      expect(api.post).toHaveBeenCalledWith(
        "/transit/SHP-001/update-location",
        payload
      );
    });
  });

  describe("getEstimatedArrival", () => {
    it("should calculate estimated arrival date", async () => {
      const mockResponse = {
        shipment_id: "SHP-001",
        current_location: "Singapore Strait",
        estimated_arrival: "2024-01-20T14:00:00Z",
        days_remaining: 5,
        on_schedule: true,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await transitService.getEstimatedArrival("SHP-001");

      expect(result.on_schedule).toBe(true);
      expect(result.days_remaining).toBe(5);
    });
  });

  describe("notifyDelayedShipment", () => {
    it("should create alert for delayed shipment", async () => {
      const mockResponse = {
        alert_id: 1,
        shipment_id: "SHP-001",
        delay_reason: "Weather delays",
        delay_days: 3,
        notification_sent: true,
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        delay_reason: "Weather delays",
        delay_days: 3,
      };

      const result = await transitService.notifyDelayedShipment(
        "SHP-001",
        payload
      );

      expect(result.notification_sent).toBe(true);
    });
  });
});
