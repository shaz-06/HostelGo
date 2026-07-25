import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { Capacitor } from '@capacitor/core'

// Dynamically resolve API URL depending on build environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://api.buyto.co.in"
    : "http://localhost:8000");

window.API_BASE_URL = API_BASE_URL;

console.log("API_BASE_URL:", window.API_BASE_URL);
console.log("Platform:", Capacitor.getPlatform());

// Swap manifest if path starts with /admin
const manifestLink = document.getElementById("pwa-manifest");
if (manifestLink) {
  if (window.location.pathname.startsWith("/admin")) {
    manifestLink.setAttribute("href", "/admin-manifest.json");
  } else {
    manifestLink.setAttribute("href", "/manifest.json");
  }
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service worker registered successfully', reg))
      .catch((err) => console.error('Service worker registration failed', err));
  });
}

import ErrorBoundary from "./components/common/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Developer mobile viewport overflow console warning diagnostics script in dev mode
if (import.meta.env.DEV) {
  setInterval(() => {
    const width = window.innerWidth;
    const all = document.querySelectorAll("*");

    const hasClippingAncestor = (el) => {
      let parent = el.parentElement;
      while (parent) {
        if (parent.tagName === "HTML" || parent.tagName === "BODY" || parent.id === "root") {
          parent = parent.parentElement;
          continue;
        }
        const style = window.getComputedStyle(parent);
        if (
          style.overflowX === "auto" ||
          style.overflowX === "scroll" ||
          style.overflowX === "hidden" ||
          style.overflow === "auto" ||
          style.overflow === "scroll" ||
          style.overflow === "hidden"
        ) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    all.forEach(el => {
      if (el.id === "root" || el.tagName === "HTML" || el.tagName === "BODY") return;
      const rect = el.getBoundingClientRect();
      if (rect.right > width + 1 && !hasClippingAncestor(el)) {
        const classNameStr = el.getAttribute('class') || '';
        const classes = classNameStr.split(/\s+/).filter(Boolean).join(".");
        console.warn(`[OVERFLOW] ${el.tagName}.${classes}#${el.id} (R: ${Math.round(rect.right)}px > VW: ${width}px)`);
      }
    });
  }, 3000);
}