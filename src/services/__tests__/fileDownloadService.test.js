import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the axiosApi default export (raw axios instance)
const mockRequest = vi.fn();
vi.mock("../axiosApi.js", () => ({
  default: {
    request: mockRequest,
  },
  apiService: {
    get: vi.fn(),
    cleanParams: (p) => p,
  },
}));

describe("fileDownloadService", () => {
  let service;
  const origCreateObjectURL = globalThis.URL.createObjectURL;
  const origRevokeObjectURL = globalThis.URL.revokeObjectURL;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
    service = await import("../fileDownloadService.js");
  });

  afterEach(() => {
    globalThis.URL.createObjectURL = origCreateObjectURL;
    globalThis.URL.revokeObjectURL = origRevokeObjectURL;
  });

  describe("fetchBlob", () => {
    it("returns blob, filename, and contentType", async () => {
      const mockBlob = new Blob(["x".repeat(200)], { type: "application/pdf" });
      mockRequest.mockResolvedValue({
        data: mockBlob,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="INV-001.pdf"',
        },
      });

      const result = await service.fetchBlob("/invoices/1/pdf");
      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe("INV-001.pdf");
      expect(result.contentType).toBe("application/pdf");
    });

    it("sends responseType: blob to axios", async () => {
      const mockBlob = new Blob(["x".repeat(200)], { type: "application/pdf" });
      mockRequest.mockResolvedValue({
        data: mockBlob,
        headers: { "content-type": "application/pdf" },
      });

      await service.fetchBlob("/test", { timeout: 30000 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          responseType: "blob",
          timeout: 30000,
        })
      );
    });

    it("passes params to request", async () => {
      const mockBlob = new Blob(["data"], { type: "text/csv" });
      mockRequest.mockResolvedValue({
        data: mockBlob,
        headers: { "content-type": "text/csv" },
      });

      await service.fetchBlob("/export", { params: { format: "csv" } });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { format: "csv" },
        })
      );
    });

    it("throws on JSON error response", async () => {
      const errorBlob = new Blob([JSON.stringify({ message: "Not found" })], {
        type: "application/json",
      });
      mockRequest.mockResolvedValue({
        data: errorBlob,
        headers: { "content-type": "application/json" },
      });

      await expect(service.fetchBlob("/invoices/999/pdf")).rejects.toThrow("Not found");
    });

    it("throws on HTML error page response", async () => {
      const htmlBlob = new Blob(["<html><body>Error</body></html>"], {
        type: "text/html",
      });
      mockRequest.mockResolvedValue({
        data: htmlBlob,
        headers: { "content-type": "text/html" },
      });

      await expect(service.fetchBlob("/invoices/1/pdf", { expectedType: "application/pdf" })).rejects.toThrow(
        "HTML error page"
      );
    });

    it("throws on non-blob response", async () => {
      mockRequest.mockResolvedValue({
        data: { error: "something" },
        headers: {},
      });

      await expect(service.fetchBlob("/invoices/1/pdf")).rejects.toThrow("expected binary data");
    });
  });

  describe("filename extraction", () => {
    const extract = (h) => service.default._extractFilenameFromHeader(h);

    it("extracts standard filename", () => {
      expect(extract('attachment; filename="invoice.pdf"')).toBe("invoice.pdf");
    });

    it("extracts unquoted filename", () => {
      expect(extract("attachment; filename=report.csv")).toBe("report.csv");
    });

    it("extracts UTF-8 encoded filename", () => {
      expect(extract("attachment; filename*=UTF-8''inv%C3%B3ice.pdf")).toBe("invóice.pdf");
    });

    it("returns null for missing header", () => {
      expect(extract(null)).toBeNull();
      expect(extract("")).toBeNull();
    });
  });

  describe("binary validation", () => {
    const validate = (b, t) => service.default._validateBinaryResponse(b, t);

    it("accepts valid blob", async () => {
      const blob = new Blob(["x".repeat(200)], { type: "application/pdf" });
      await expect(validate(blob, "application/pdf")).resolves.toBeUndefined();
    });

    it("rejects null response", async () => {
      await expect(validate(null)).rejects.toThrow("expected binary data");
    });

    it("rejects JSON error blobs", async () => {
      const blob = new Blob([JSON.stringify({ message: "fail" })], { type: "application/json" });
      await expect(validate(blob, "application/pdf")).rejects.toThrow("fail");
    });

    it("rejects tiny PDFs", async () => {
      const blob = new Blob(["x"], { type: "application/pdf" });
      await expect(validate(blob, "application/pdf")).rejects.toThrow("suspiciously small");
    });
  });

  describe("downloadFile", () => {
    it("creates download link, clicks, and cleans up", async () => {
      const mockBlob = new Blob(["x".repeat(200)], { type: "application/pdf" });
      mockRequest.mockResolvedValue({
        data: mockBlob,
        headers: { "content-type": "application/pdf" },
      });

      const mockLink = { href: "", download: "", style: {}, click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
      vi.spyOn(document.body, "removeChild").mockImplementation(() => {});

      await service.downloadFile("/invoices/1/pdf", "test.pdf");

      expect(mockLink.download).toBe("test.pdf");
      expect(mockLink.click).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("prefers server filename over fallback", async () => {
      const mockBlob = new Blob(["x".repeat(200)], { type: "application/pdf" });
      mockRequest.mockResolvedValue({
        data: mockBlob,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="server-name.pdf"',
        },
      });

      const mockLink = { href: "", download: "", style: {}, click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
      vi.spyOn(document.body, "removeChild").mockImplementation(() => {});

      await service.downloadFile("/invoices/1/pdf", "fallback.pdf");

      expect(mockLink.download).toBe("server-name.pdf");
    });
  });

  describe("downloadLocalBlob", () => {
    it("creates blob from string and downloads", () => {
      const mockLink = { href: "", download: "", style: {}, click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
      vi.spyOn(document.body, "removeChild").mockImplementation(() => {});

      service.downloadLocalBlob("col1,col2\nval1,val2", "export.csv");

      expect(mockLink.download).toBe("export.csv");
      expect(mockLink.click).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
