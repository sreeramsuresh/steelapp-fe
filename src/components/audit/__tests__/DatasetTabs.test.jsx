import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DatasetTabs from "../DatasetTabs";

describe("DatasetTabs", () => {
  const modules = ["SALES", "PURCHASES", "INVENTORY"];

  it("renders all module tabs", () => {
    render(
      <DatasetTabs
        modules={modules}
        activeModule="SALES"
        onModuleChange={vi.fn()}
      />
    );
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Purchases")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });

  it("calls onModuleChange when tab is clicked", () => {
    const onChange = vi.fn();
    render(
      <DatasetTabs
        modules={modules}
        activeModule="SALES"
        onModuleChange={onChange}
      />
    );
    screen.getByText("Purchases").click();
    expect(onChange).toHaveBeenCalledWith("PURCHASES");
  });

  it("displays record count badges when counts provided", () => {
    render(
      <DatasetTabs
        modules={modules}
        activeModule="SALES"
        onModuleChange={vi.fn()}
        recordCounts={{ SALES: 42, PURCHASES: 15 }}
      />
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("does not show badge for zero count", () => {
    render(
      <DatasetTabs
        modules={["SALES"]}
        activeModule="SALES"
        onModuleChange={vi.fn()}
        recordCounts={{ SALES: 0 }}
      />
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders VAT and BANK modules", () => {
    render(
      <DatasetTabs
        modules={["VAT", "BANK"]}
        activeModule="VAT"
        onModuleChange={vi.fn()}
      />
    );
    expect(screen.getByText("VAT")).toBeInTheDocument();
    expect(screen.getByText("Bank")).toBeInTheDocument();
  });
});
