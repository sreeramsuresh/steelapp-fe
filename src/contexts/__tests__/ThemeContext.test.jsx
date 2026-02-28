import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "../ThemeContext";

function TestConsumer() {
  const { isDarkMode, themeMode, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="isDarkMode">{String(isDarkMode)}</span>
      <span data-testid="themeMode">{themeMode}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="setDark" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button data-testid="setLight" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("provides light theme by default", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("themeMode")).toHaveTextContent("light");
    expect(screen.getByTestId("isDarkMode")).toHaveTextContent("false");
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem("themeMode", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("themeMode")).toHaveTextContent("dark");
    expect(screen.getByTestId("isDarkMode")).toHaveTextContent("true");
  });

  it("converts legacy 'system' mode to 'light'", () => {
    localStorage.setItem("themeMode", "system");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("themeMode")).toHaveTextContent("light");
  });

  it("toggles theme from light to dark", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(screen.getByTestId("themeMode")).toHaveTextContent("dark");
    expect(screen.getByTestId("isDarkMode")).toHaveTextContent("true");
  });

  it("toggles theme from dark to light", () => {
    localStorage.setItem("themeMode", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(screen.getByTestId("themeMode")).toHaveTextContent("light");
    expect(screen.getByTestId("isDarkMode")).toHaveTextContent("false");
  });

  it("persists theme to localStorage on toggle", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(localStorage.getItem("themeMode")).toBe("dark");
  });

  it("setTheme sets a specific mode and persists", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("setDark").click();
    });

    expect(screen.getByTestId("themeMode")).toHaveTextContent("dark");
    expect(localStorage.getItem("themeMode")).toBe("dark");

    act(() => {
      screen.getByTestId("setLight").click();
    });

    expect(screen.getByTestId("themeMode")).toHaveTextContent("light");
    expect(localStorage.getItem("themeMode")).toBe("light");
  });

  it("adds dark class to document root in dark mode", () => {
    localStorage.setItem("themeMode", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document root in light mode", () => {
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws error when useTheme is used outside ThemeProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );

    spy.mockRestore();
  });
});
