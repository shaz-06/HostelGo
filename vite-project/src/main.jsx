import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Dynamically resolve API URL depending on client platform
let apiBase = '';
if (import.meta.env.MODE === 'production') {
  // Production: Use the configured VITE_API_URL only. Do not fall back to local network IPs.
  apiBase = import.meta.env.VITE_API_URL || 'https://buyto-api.onrender.com';
} else {
  // Development:
  const isNative = window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:';
  if (import.meta.env.VITE_API_URL && !(isNative && import.meta.env.VITE_API_URL.includes('localhost'))) {
    apiBase = import.meta.env.VITE_API_URL;
  } else if (isNative) {
    // Under live reload, window.location.hostname is the Mac's IP (e.g. 192.168.x.x)
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0') {
      apiBase = `http://${host}:8000`;
    } else {
      apiBase = 'http://10.0.2.2:8000'; // Default Android emulator loopback
    }
  } else {
    // Browser development
    apiBase = 'http://localhost:8000';
  }
}
window.API_BASE_URL = apiBase;

console.log("=== API_BASE_URL INITIALIZED ===", window.API_BASE_URL);

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
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
        console.warn(`[OVERFLOW] ${el.tagName}.${el.className.split(" ").filter(c => c).join(".")}#${el.id} (R: ${Math.round(rect.right)}px > VW: ${width}px)`);
      }
    });
  }, 3000);
}