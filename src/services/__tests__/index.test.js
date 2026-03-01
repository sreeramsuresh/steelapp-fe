import { describe, expect, it } from "vitest";

describe("services/index.js", () => {
  it("should re-export analyticsService", async () => {
    const mod = await import("../index.js");
    expect(mod.analyticsService).toBeDefined();
  });

  it("should re-export apiClient", async () => {
    const mod = await import("../index.js");
    expect(mod.apiClient).toBeDefined();
  });

  it("should re-export commissionService", async () => {
    const mod = await import("../index.js");
    expect(mod.commissionService).toBeDefined();
  });

  it("should re-export companyService", async () => {
    const mod = await import("../index.js");
    expect(mod.companyService).toBeDefined();
  });

  it("should re-export customerService", async () => {
    const mod = await import("../index.js");
    expect(mod.customerService).toBeDefined();
  });

  it("should re-export inventoryService", async () => {
    const mod = await import("../index.js");
    expect(mod.inventoryService).toBeDefined();
  });

  it("should re-export invoiceService", async () => {
    const mod = await import("../index.js");
    expect(mod.invoiceService).toBeDefined();
  });

  it("should re-export productService", async () => {
    const mod = await import("../index.js");
    expect(mod.productService).toBeDefined();
  });

  it("should re-export stockMovementService", async () => {
    const mod = await import("../index.js");
    expect(mod.stockMovementService).toBeDefined();
  });

  it("should re-export uomValidationService", async () => {
    const mod = await import("../index.js");
    expect(mod.uomValidationService).toBeDefined();
  });
});
