import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useInvoiceTemplates, { INVOICE_TEMPLATES, RECURRING_FREQUENCIES } from "../useInvoiceTemplates";

vi.mock("../../services/companyService", () => ({
  companyService: {
    getCompany: vi.fn().mockResolvedValue({ settings: {} }),
    updateCompany: vi.fn().mockResolvedValue({}),
  },
}));

const STORAGE_KEY = "steelapp_invoice_template_prefs";

describe("useInvoiceTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("returns initial state with standard template", () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    expect(result.current.selectedTemplateId).toBe("standard");
    expect(result.current.currentTemplate.id).toBe("standard");
    expect(result.current.customColors).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.templates).toHaveLength(Object.keys(INVOICE_TEMPLATES).length);
  });

  it("accepts initial template parameter", () => {
    const { result } = renderHook(() => useInvoiceTemplates("modern"));

    expect(result.current.selectedTemplateId).toBe("modern");
    expect(result.current.currentTemplate.id).toBe("modern");
  });

  it("loads saved preferences from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        templateId: "minimal",
        customColors: null,
      })
    );

    const { result } = renderHook(() => useInvoiceTemplates());

    expect(result.current.selectedTemplateId).toBe("minimal");
  });

  it("selects a template", async () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    await act(async () => {
      result.current.selectTemplate("modern");
    });

    expect(result.current.selectedTemplateId).toBe("modern");
    expect(result.current.currentTemplate.id).toBe("modern");
  });

  it("ignores invalid template selection", async () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    await act(async () => {
      result.current.selectTemplate("nonexistent");
    });

    expect(result.current.selectedTemplateId).toBe("standard");
  });

  it("updates custom colors", async () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    await act(async () => {
      result.current.updateColors({ primary: "#ff0000" });
    });

    expect(result.current.customColors).toEqual({ primary: "#ff0000" });
    expect(result.current.currentTemplate.colors.primary).toBe("#ff0000");
  });

  it("resets colors to null", async () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    await act(async () => {
      result.current.updateColors({ primary: "#ff0000" });
    });

    await act(async () => {
      result.current.resetColors();
    });

    expect(result.current.customColors).toBeNull();
  });

  it("clears custom colors when switching away from modern", async () => {
    const { result } = renderHook(() => useInvoiceTemplates("modern"));

    await act(async () => {
      result.current.updateColors({ primary: "#ff0000" });
    });

    await act(async () => {
      result.current.selectTemplate("standard");
    });

    expect(result.current.customColors).toBeNull();
  });

  it("getTemplateStyles returns CSS variables", () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    const styles = result.current.getTemplateStyles();
    expect(styles["--invoice-primary"]).toBe(INVOICE_TEMPLATES.standard.colors.primary);
    expect(styles["--invoice-heading-font"]).toBe(INVOICE_TEMPLATES.standard.fonts.heading);
  });

  it("getTemplateClasses returns layout-based classes", () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    expect(result.current.getTemplateClasses("header")).toContain("header-");
    expect(result.current.getTemplateClasses("items")).toContain("items-");
    expect(result.current.getTemplateClasses("totals")).toContain("totals-");
  });

  it("saves to localStorage on state changes", async () => {
    const { result } = renderHook(() => useInvoiceTemplates());

    await act(async () => {
      result.current.selectTemplate("modern");
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.templateId).toBe("modern");
  });

  describe("recurring settings", () => {
    it("has default recurring settings", () => {
      const { result } = renderHook(() => useInvoiceTemplates());

      expect(result.current.recurringSettings.enabled).toBe(false);
      expect(result.current.recurringSettings.frequency).toBe("monthly");
    });

    it("toggles recurring on/off", () => {
      const { result } = renderHook(() => useInvoiceTemplates());

      act(() => {
        result.current.toggleRecurring(true);
      });
      expect(result.current.recurringSettings.enabled).toBe(true);

      act(() => {
        result.current.toggleRecurring(false);
      });
      expect(result.current.recurringSettings.enabled).toBe(false);
    });

    it("toggles without argument", () => {
      const { result } = renderHook(() => useInvoiceTemplates());

      act(() => {
        result.current.toggleRecurring();
      });
      expect(result.current.recurringSettings.enabled).toBe(true);
    });

    it("updates recurring settings", () => {
      const { result } = renderHook(() => useInvoiceTemplates());

      act(() => {
        result.current.updateRecurringSettings({
          frequency: "weekly",
          startDate: "2025-01-01",
        });
      });

      expect(result.current.recurringSettings.frequency).toBe("weekly");
      expect(result.current.recurringSettings.startDate).toBe("2025-01-01");
    });
  });

  it("loads settings from company props", async () => {
    const companySettings = {
      settings: {
        invoiceTemplate: {
          id: "minimal",
          colors: { primary: "#1e3a5f" },
        },
      },
    };

    const { result } = renderHook(() => useInvoiceTemplates("standard", companySettings));

    await vi.waitFor(() => {
      expect(result.current.selectedTemplateId).toBe("minimal");
    });

    expect(result.current.loadedFromCompany).toBe(true);
  });

  it("exports RECURRING_FREQUENCIES", () => {
    expect(RECURRING_FREQUENCIES).toBeTruthy();
    expect(RECURRING_FREQUENCIES.length).toBeGreaterThan(0);
    expect(RECURRING_FREQUENCIES[0]).toHaveProperty("value");
    expect(RECURRING_FREQUENCIES[0]).toHaveProperty("label");
  });
});
