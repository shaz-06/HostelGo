import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import UserDetails from "./pages/UserDetails";

// Dynamically resolve API URL depending on client platform
let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (window.Capacitor || window.location.protocol === 'capacitor:') {
  if (import.meta.env.MODE === 'production') {
    apiBase = import.meta.env.VITE_API_URL || 'https://api.buyto.co.in';
  } else {
    apiBase = 'http://10.0.2.2:8000';
  }
} else {
  apiBase = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.buyto.co.in' : 'http://localhost:8000');
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