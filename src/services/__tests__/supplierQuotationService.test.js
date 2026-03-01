import { describe, expect, it } from "vitest";

import * as supplierQuotationService from "../supplierQuotationService.js";

describe("supplierQuotationService", () => {
  it("should export transformQuotationFromServer", () => {
    expect(typeof supplierQuotationService.transformQuotationFromServer).toBe("function");
  });

  it("should handle null input in transformQuotationFromServer", () => {
    const result = supplierQuotationService.transformQuotationFromServer(null);
    expect(result).toBeNull();
  });
});
