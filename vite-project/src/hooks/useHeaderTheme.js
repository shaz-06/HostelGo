import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

let currentTheme = "green"; // default fallback
let hasInitialized = false;
const listeners = new Set();

const updateListeners = () => {
  listeners.forEach((listener) => listener(currentTheme));
};

// Safely resolve AsyncStorage for React Native / Expo environment
let AsyncStorage = null;
try {
  // Use dynamic variable to prevent Vite static analysis from failing to resolve it
  const packageName = "@react-native-async-storage/async-storage";
  if (typeof require !== "undefined") {
    AsyncStorage = require(packageName);
  }
} catch (e) {
  // Ignored - fall back to localStorage
}

const getStorageItem = async (key) => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
      return await AsyncStorage.getItem(key);
    }
  } catch (e) {}
  try {
    return localStorage.getItem(key);
  } catch (e) {}
  return null;
};

const setStorageItem = async (key, value) => {
  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === "function") {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {}
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

// Initialize theme once on startup
const initTheme = async () => {
  if (hasInitialized) return;
  hasInitialized = true;

  const lastColor = await getStorageItem("buyto_last_header_color");
  // Rotate color
  const nextColor = lastColor === "green" ? "orange" : "green";
  currentTheme = nextColor;
  await setStorageItem("buyto_last_header_color", nextColor);
  updateListeners();

  // Apply to Capacitor StatusBar
  if (Capacitor.isNativePlatform()) {
    try {
      // Both #C2E19C (pastel green) and #FCE7C8 (pastel orange) are light backgrounds.
      // So we use Style.Light (dark icons/text) for both themes to ensure readability.
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      console.error("Error applying status bar theme:", e);
    }
  }
};

// Trigger immediately on load
initTheme();

export function useHeaderTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    listeners.add(setTheme);
    // Sync state in case it changed during initialization
    if (theme !== currentTheme) {
      setTheme(currentTheme);
    }
    return () => {
      listeners.delete(setTheme);
    };
  }, [theme]);

  const isGreenTheme = theme === "green";
  const headerColor = isGreenTheme ? "#C2E19C" : "#FCE7C8";
  const textColor = "#1f2937"; // Dark text color for light pastel backgrounds

  return {
    headerColor,
    textColor,
    isGreenTheme
  };
}
