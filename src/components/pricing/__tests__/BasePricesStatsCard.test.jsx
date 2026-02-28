import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import BasePricesStatsCard from "../BasePricesStatsCard";
import { DollarSign } from "lucide-react";

describe("BasePricesStatsCard", () => {
  it("renders label and value", () => {
    render(
      <BasePricesStatsCard
        icon={DollarSign}
        label="Total Products"
        value={42}
        isDarkMode={false}
      />
    );
    expect(screen.getByText("Total Products")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats large numbers without decimals", () => {
    render(
      <BasePricesStatsCard
        icon={DollarSign}
        label="Revenue"
        value={12345}
        isDarkMode={false}
      />
    );
    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("renders string values as-is", () => {
    render(
      <BasePricesStatsCard
        icon={DollarSign}
        label="Status"
        value="Active"
        isDarkMode={false}
      />
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
