import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import UserDetails from "./pages/UserDetails";

// Dynamically resolve API URL depending on client platform
let apiBase = '';
if (import.meta.env.MODE === 'production') {
  // Production: Use the configured VITE_API_URL only. Do not fall back to local network IPs.
  apiBase = import.meta.env.VITE_API_URL || 'https://buyto-api.onrender.com';
} else {
  // Development:
  if (import.meta.env.VITE_API_URL) {
    apiBase = import.meta.env.VITE_API_URL;
  } else if (window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:') {
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

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service worker registered successfully', reg))
      .catch((err) => console.error('Service worker registration failed', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)