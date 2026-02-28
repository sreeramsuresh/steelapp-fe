import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePricingPolicy, PRICING_MODES, PRIMARY_UNITS } from "../usePricingPolicy";

const mockService = {
  listCategoryPolicies: vi.fn(),
  buildPolicyCache: vi.fn(),
  getPricingUnitFromPolicy: vi.fn(),
  requiresWeight: vi.fn(),
  isConvertible: vi.fn(),
};

vi.mock("../../services/categoryPolicyService", () => ({
  default: mockService,
}));

describe("usePricingPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [], taxonomy_status: null });
    mockService.buildPolicyCache.mockReturnValue(new Map());
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => usePricingPolicy(1, { autoFetch: false }));

    expect(result.current.policies).toEqual([]);
    expect(result.current.taxonomyStatus).toBeNull();
    expect(result.current.isFrozen).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.PRICING_MODES).toBe(PRICING_MODES);
    expect(result.current.PRIMARY_UNITS).toBe(PRIMARY_UNITS);
  });

  it("auto-fetches policies on mount", async () => {
    const policies = [{ category: "coil", pricing_mode: "MT_ONLY" }];
    mockService.listCategoryPolicies.mockResolvedValue({
      policies,
      taxonomy_status: { status: "ACTIVE" },
    });
    mockService.buildPolicyCache.mockReturnValue(new Map([["coil", policies[0]]]));

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies).toEqual(policies);
    });

    expect(result.current.taxonomyStatus).toEqual({ status: "ACTIVE" });
    expect(result.current.isFrozen).toBe(true);
  });

  it("sets error when companyId is missing", async () => {
    const { result } = renderHook(() => usePricingPolicy(null));

    // autoFetch with null companyId should set error
    await vi.waitFor(() => {
      expect(result.current.error).toBe("Company ID is required");
    });
  });

  it("handles API error", async () => {
    mockService.listCategoryPolicies.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });

    expect(result.current.policies).toEqual([]);
  });

  it("getPolicyForCategory returns cached policy", async () => {
    const coilPolicy = { category: "coil", pricing_mode: "MT_ONLY" };
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [coilPolicy] });
    mockService.buildPolicyCache.mockReturnValue(new Map([["coil", coilPolicy]]));

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies.length).toBe(1);
    });

    expect(result.current.getPolicyForCategory("coil")).toEqual(coilPolicy);
    expect(result.current.getPolicyForCategory("Coil")).toEqual(coilPolicy);
    expect(result.current.getPolicyForCategory("nonexistent")).toBeNull();
    expect(result.current.getPolicyForCategory(null)).toBeNull();
  });

  it("getPricingUnitForCategory delegates to service", async () => {
    const policy = { pricing_mode: "MT_ONLY" };
    mockService.buildPolicyCache.mockReturnValue(new Map([["coil", policy]]));
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [policy] });
    mockService.getPricingUnitFromPolicy.mockReturnValue("WEIGHT");

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies.length).toBe(1);
    });

    expect(result.current.getPricingUnitForCategory("coil")).toBe("WEIGHT");
  });

  it("requiresWeight delegates to service", async () => {
    const policy = { pricing_mode: "MT_ONLY" };
    mockService.buildPolicyCache.mockReturnValue(new Map([["sheet", policy]]));
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [policy] });
    mockService.requiresWeight.mockReturnValue(true);

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies.length).toBe(1);
    });

    expect(result.current.requiresWeight("sheet")).toBe(true);
  });

  it("isConvertible delegates to service", async () => {
    const policy = { pricing_mode: "CONVERTIBLE" };
    mockService.buildPolicyCache.mockReturnValue(new Map([["pipe", policy]]));
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [policy] });
    mockService.isConvertible.mockReturnValue(true);

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies.length).toBe(1);
    });

    expect(result.current.isConvertible("pipe")).toBe(true);
  });

  it("getCategories returns keys from cache", async () => {
    mockService.buildPolicyCache.mockReturnValue(
      new Map([
        ["coil", {}],
        ["sheet", {}],
      ])
    );
    mockService.listCategoryPolicies.mockResolvedValue({ policies: [{}, {}] });

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.policies.length).toBe(2);
    });

    const cats = result.current.getCategories();
    expect(cats).toContain("coil");
    expect(cats).toContain("sheet");
  });

  describe("validateCategoryPricingUnit", () => {
    it("returns invalid when category is missing", () => {
      const { result } = renderHook(() => usePricingPolicy(1, { autoFetch: false }));
      const validation = result.current.validateCategoryPricingUnit(null, "WEIGHT");
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("required");
    });

    it("returns invalid when pricing unit is missing", () => {
      const { result } = renderHook(() => usePricingPolicy(1, { autoFetch: false }));
      const validation = result.current.validateCategoryPricingUnit("coil", null);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("required");
    });

    it("returns invalid for unknown category", () => {
      mockService.buildPolicyCache.mockReturnValue(new Map());
      mockService.getPricingUnitFromPolicy.mockReturnValue(null);
      const { result } = renderHook(() => usePricingPolicy(1, { autoFetch: false }));

      const validation = result.current.validateCategoryPricingUnit("unknown", "WEIGHT");
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("Unknown");
    });
  });

  it("isFrozen returns true for FROZEN status", async () => {
    mockService.listCategoryPolicies.mockResolvedValue({
      policies: [],
      taxonomy_status: { status: "FROZEN" },
    });
    mockService.buildPolicyCache.mockReturnValue(new Map());

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.isFrozen).toBe(true);
    });
  });

  it("isFrozen returns false for DRAFT status", async () => {
    mockService.listCategoryPolicies.mockResolvedValue({
      policies: [],
      taxonomy_status: { status: "DRAFT" },
    });
    mockService.buildPolicyCache.mockReturnValue(new Map());

    const { result } = renderHook(() => usePricingPolicy(1));

    await vi.waitFor(() => {
      expect(result.current.taxonomyStatus).toBeTruthy();
    });

    expect(result.current.isFrozen).toBe(false);
  });
});
