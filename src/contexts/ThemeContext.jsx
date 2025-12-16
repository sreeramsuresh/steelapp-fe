import { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    // Convert old 'system' mode to 'light' as default
    return saved === "system" ? "light" : saved || "light";
  });

  // Determine the actual theme based on mode
  const isDarkMode = themeMode === "dark";

  // Cycle through theme modes: light -> dark -> light...
  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  // Set specific theme mode
  const setTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
  };

  useEffect(() => {
    // Update CSS custom properties for the current theme
    const root = document.documentElement;

    if (isDarkMode) {
      // Dark theme CSS variables
      root.style.setProperty("--primary-bg", "#121418");
      root.style.setProperty("--secondary-bg", "#1E2328");
      root.style.setProperty("--tertiary-bg", "#2E3B4E");
      root.style.setProperty("--card-bg", "#1E2328");
      root.style.setProperty("--text-primary", "#FFFFFF");
      root.style.setProperty("--text-secondary", "#B0BEC5");
      root.style.setProperty("--text-muted", "#78909C");
      root.style.setProperty("--border-primary", "#37474F");
      root.style.setProperty("--border-secondary", "#455A73");
    } else {
      // Light theme CSS variables
      root.style.setProperty("--primary-bg", "#FAFAFA");
      root.style.setProperty("--secondary-bg", "#FFFFFF");
      root.style.setProperty("--tertiary-bg", "#F5F5F5");
      root.style.setProperty("--card-bg", "#FFFFFF");
      root.style.setProperty("--text-primary", "#212121");
      root.style.setProperty("--text-secondary", "#757575");
      root.style.setProperty("--text-muted", "#BDBDBD");
      root.style.setProperty("--border-primary", "#E0E0E0");
      root.style.setProperty("--border-secondary", "#BDBDBD");
    }
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    themeMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
