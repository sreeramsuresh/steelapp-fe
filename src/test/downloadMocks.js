import { vi } from "vitest";

/**
 * Mock browser download primitives (createElement("a"), URL.createObjectURL, etc.)
 * so file-download service methods can be tested deterministically in jsdom / CI.
 *
 * Usage:
 *   let mocks;
 *   beforeEach(() => { mocks = mockBrowserDownload(); });
 *   afterEach(() => { vi.restoreAllMocks(); });
 *
 *   // then assert:
 *   expect(mocks.createObjectURL).toHaveBeenCalled();
 *   expect(mocks.click).toHaveBeenCalled();
 *   expect(mocks.revokeObjectURL).toHaveBeenCalled();
 */
export function mockBrowserDownload() {
  const click = vi.fn();

  const anchor = {
    click,
    href: "",
    download: "",
    rel: "",
    target: "",
    style: {},
  };

  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "a") return anchor;
    return origCreateElement(tag);
  });

  vi.spyOn(document.body, "appendChild").mockImplementation(() => anchor);
  vi.spyOn(document.body, "removeChild").mockImplementation(() => anchor);

  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();

  Object.defineProperty(globalThis, "URL", {
    value: { createObjectURL, revokeObjectURL },
    writable: true,
    configurable: true,
  });

  return { anchor, click, createObjectURL, revokeObjectURL };
}
