import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

const ThemeContext = createContext({
  theme: "LIGHT",
  isDark: false,
  setTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("buyto_theme");
    if (saved) return saved;
    try {
      localStorage.setItem("buyto_theme", "LIGHT");
    } catch (e) {
      console.error("Failed to persist default theme:", e);
    }
    return "LIGHT";
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === "DARK") return true;
    if (theme === "LIGHT") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Centralized setTheme handler
  const setTheme = useCallback((newTheme) => {
    if (newTheme !== "LIGHT" && newTheme !== "DARK" && newTheme !== "SYSTEM") return;
    setThemeState(newTheme);
    localStorage.setItem("buyto_theme", newTheme);
  }, []);

  // Update theme helper
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateTheme = () => {
      let nextDark = false;
      if (theme === "DARK") {
        nextDark = true;
      } else if (theme === "LIGHT") {
        nextDark = false;
      } else {
        nextDark = mediaQuery.matches;
      }

      setIsDark(nextDark);

      // Apply/remove class & set native browser properties
      const root = document.documentElement;
      const body = document.body;
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');

      if (nextDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
        root.style.background = "#0F1115";
        if (body) body.style.background = "#0F1115";
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#0F1115");
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
        root.style.background = "#f7f8fa";
        if (body) body.style.background = "#f7f8fa";
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#318616");
      }
    };

    updateTheme();

    // Listen to device theme changes if system theme is selected
    const handleChange = () => {
      if (theme === "SYSTEM") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = React.useMemo(() => ({
    theme,
    isDark,
    setTheme
  }), [theme, isDark, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };
