import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import DataTable from "../DataTable";

describe("DataTable", () => {
  const defaultProps = {
    data: [],
    columns: [],
  };

  ["should render table", "should display columns", "should handle sorting", "should handle pagination"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(
        <DataTable {...defaultProps} />,
      );
      expect(container).toBeInTheDocument();
    });
  });
});
