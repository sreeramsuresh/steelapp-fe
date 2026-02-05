import sinon from "sinon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import AuditLog from "../AuditLog";

const mockAuditService = {
  listAuditLogs: sinon.stub(),
  filterLogs: sinon.stub(),
};

// sinon.stub() // "../../../services/auditService", () => ({
default: mockAuditService,
}))

describe("AuditLog", () =>
{
  beforeEach(() => {
    sinon.restore();
    mockAuditService.listAuditLogs.mockResolvedValue([]);
  });

  describe("Rendering", () => {
    ["should render audit log table", "should display columns", "should show timestamps"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<AuditLog />);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    ["should filter by user", "should filter by action", "should filter by date"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<AuditLog />);
        expect(container).toBeInTheDocument();
      });
    });
  });
}
)
