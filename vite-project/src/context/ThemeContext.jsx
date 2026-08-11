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

  const [transitionState, setTransitionState] = useState({ visible: false, targetTheme: null });

  // Centralized setTheme handler with visual transition experience
  const setTheme = useCallback((newTheme) => {
    if (newTheme !== "LIGHT" && newTheme !== "DARK" && newTheme !== "SYSTEM") return;
    if (newTheme === theme) return; // Prevent duplicate transition if clicking the same option

    let targetMode = newTheme;
    if (newTheme === "SYSTEM") {
      targetMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "DARK" : "LIGHT";
    }

    setTransitionState({
      visible: true,
      targetTheme: targetMode
    });

    // Short transition delay before applying the core theme state update
    setTimeout(() => {
      setThemeState(newTheme);
      localStorage.setItem("buyto_theme", newTheme);
    }, 450);

    // Turn off transition overlay after the change is complete
    setTimeout(() => {
      setTransitionState({ visible: false, targetTheme: null });
    }, 850);
  }, [theme]);

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
      {transitionState.visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: transitionState.targetTheme === "DARK" ? "#0F1115" : "#f7f8fa",
            color: transitionState.targetTheme === "DARK" ? "#ffffff" : "#111827",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            pointerEvents: "auto",
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: `4px solid ${transitionState.targetTheme === "DARK" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                borderTop: "4px solid #318616",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}
            />
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "900", margin: 0, tracking: "tight" }}>
                Switching to {transitionState.targetTheme === "DARK" ? "Dark" : "Light"} theme
              </h2>
              <p style={{ fontSize: "14px", fontWeight: "600", color: transitionState.targetTheme === "DARK" ? "#9CA3AF" : "#6B7280", margin: 0 }}>
                Hold on...
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };
