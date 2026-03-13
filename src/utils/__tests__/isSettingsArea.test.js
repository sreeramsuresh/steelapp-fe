import { describe, expect, it } from "vitest";
import { isSettingsArea } from "../isSettingsArea";

describe("isSettingsArea", () => {
  it.each([
    ["/app/settings", true],
    ["/app/settings/financial", true],
    ["/app/settings/gl-mapping", true],
    ["/app/users", true],
    ["/app/audit-logs", true],
    ["/app/feedback", true],
  ])("returns true for settings path %s", (path, expected) => {
    expect(isSettingsArea(path)).toBe(expected);
  });

  it.each([
    ["/app/invoices", false],
    ["/app/settings-old", false],
    ["/app/users-extra", false],
    ["/app", false],
    ["/app/customers", false],
    ["/analytics/dashboard", false],
  ])("returns false for non-settings path %s", (path, expected) => {
    expect(isSettingsArea(path)).toBe(expected);
  });
});
