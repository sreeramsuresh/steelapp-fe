import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnitConversion, FORMULA_TYPES, UNIT_CODES, PRICING_MODES, DEFAULT_DENSITY } from "../useUnitConversion";

const mockService = {
  listConversionFormulas: vi.fn(),
  calculateWeight: vi.fn(),
  convertUnits: vi.fn(),
  getProductWeightSpec: vi.fn(),
  saveProductWeightSpec: vi.fn(),
  batchCalculateWeight: vi.fn(),
};

vi.mock("../../services/unitConversionService", () => ({
  default: mockService,
}));

describe("useUnitConversion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.listConversionFormulas.mockResolvedValue({ formulas: [] });
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));

    expect(result.current.formulas).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.calculateWeight).toBe("function");
    expect(typeof result.current.convertUnits).toBe("function");
    expect(result.current.FORMULA_TYPES).toBe(FORMULA_TYPES);
    expect(result.current.UNIT_CODES).toBe(UNIT_CODES);
    expect(result.current.DEFAULT_DENSITY).toBe(DEFAULT_DENSITY);
  });

  it("auto-fetches formulas on mount", async () => {
    const formulas = [
      { category: "Sheet", formula_type: "DIMENSIONAL", density_kg_m3: 7930 },
    ];
    mockService.listConversionFormulas.mockResolvedValue({ formulas });

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.formulas).toEqual(formulas);
    });
  });

  it("handles fetch formulas error", async () => {
    mockService.listConversionFormulas.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.error).toBe("API error");
    });
  });

  it("skips fetch when autoFetchFormulas is false", async () => {
    renderHook(() => useUnitConversion({ autoFetchFormulas: false }));

    await new Promise((r) => setTimeout(r, 50));
    expect(mockService.listConversionFormulas).not.toHaveBeenCalled();
  });

  it("getFormulaForCategory returns formula from cache", async () => {
    mockService.listConversionFormulas.mockResolvedValue({
      formulas: [{ category: "Coil", formula_type: "DIMENSIONAL" }],
    });

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.formulas.length).toBe(1);
    });

    expect(result.current.getFormulaForCategory("coil")).toEqual({
      category: "Coil",
      formula_type: "DIMENSIONAL",
    });
    expect(result.current.getFormulaForCategory("nonexistent")).toBeNull();
    expect(result.current.getFormulaForCategory(null)).toBeNull();
  });

  it("isDimensional and isWeightPerUnit check formula types", async () => {
    mockService.listConversionFormulas.mockResolvedValue({
      formulas: [
        { category: "Sheet", formula_type: "DIMENSIONAL" },
        { category: "Pipe", formula_type: "WEIGHT_PER_UNIT" },
      ],
    });

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.formulas.length).toBe(2);
    });

    expect(result.current.isDimensional("sheet")).toBe(true);
    expect(result.current.isDimensional("pipe")).toBe(false);
    expect(result.current.isWeightPerUnit("pipe")).toBe(true);
    expect(result.current.isWeightPerUnit("sheet")).toBe(false);
  });

  it("getDensity returns formula density or default", async () => {
    mockService.listConversionFormulas.mockResolvedValue({
      formulas: [{ category: "Sheet", density_kg_m3: 8000 }],
    });

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.formulas.length).toBe(1);
    });

    expect(result.current.getDensity("sheet")).toBe(8000);
    expect(result.current.getDensity("unknown")).toBe(DEFAULT_DENSITY);
  });

  it("calculateWeight calls service", async () => {
    const mockResult = { weight_kg: 100, weight_mt: 0.1 };
    mockService.calculateWeight.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));

    let calcResult;
    await act(async () => {
      calcResult = await result.current.calculateWeight(1, 10, "PCS");
    });

    expect(mockService.calculateWeight).toHaveBeenCalledWith(1, 10, "PCS");
    expect(calcResult).toEqual(mockResult);
  });

  it("convertUnits calls service", async () => {
    const mockResult = { to_quantity: 0.01, conversion_factor: 0.001 };
    mockService.convertUnits.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));

    let convertResult;
    await act(async () => {
      convertResult = await result.current.convertUnits(1, 10, "KG", "MT");
    });

    expect(mockService.convertUnits).toHaveBeenCalledWith(1, 10, "KG", "MT");
    expect(convertResult).toEqual(mockResult);
  });

  describe("isConversionAllowed", () => {
    it("allows same unit conversion", () => {
      const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));
      const check = result.current.isConversionAllowed("MT_ONLY", "KG", "KG");
      expect(check.allowed).toBe(true);
    });

    it("denies PCS_ONLY cross-unit conversion", () => {
      const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));
      const check = result.current.isConversionAllowed("PCS_ONLY", "PCS", "KG");
      expect(check.allowed).toBe(false);
    });

    it("allows MT_ONLY weight conversions", () => {
      const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));
      const check = result.current.isConversionAllowed("MT_ONLY", "MT", "KG");
      expect(check.allowed).toBe(true);
    });

    it("denies MT_ONLY non-weight conversions", () => {
      const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));
      const check = result.current.isConversionAllowed("MT_ONLY", "PCS", "KG");
      expect(check.allowed).toBe(false);
    });

    it("allows CONVERTIBLE any conversion", () => {
      const { result } = renderHook(() => useUnitConversion({ autoFetchFormulas: false }));
      const check = result.current.isConversionAllowed("CONVERTIBLE", "PCS", "MT");
      expect(check.allowed).toBe(true);
    });
  });

  it("getCategories returns cached categories", async () => {
    mockService.listConversionFormulas.mockResolvedValue({
      formulas: [
        { category: "Sheet" },
        { category: "Pipe" },
      ],
    });

    const { result } = renderHook(() => useUnitConversion());

    await vi.waitFor(() => {
      expect(result.current.formulas.length).toBe(2);
    });

    const categories = result.current.getCategories();
    expect(categories).toContain("sheet");
    expect(categories).toContain("pipe");
  });
});
