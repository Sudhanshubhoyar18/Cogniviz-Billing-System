import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for PWA (Phone App direct installation)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Auto-check for updates on load
        registration.update().catch(() => {});
      })
      .catch((err) => {
        console.log('SW registration note:', err);
      });
  });

  // Reload page when new service worker takes over to load fresh assets
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Avoid infinite loop if already reloaded
    if (!sessionStorage.getItem('sw_reloaded')) {
      sessionStorage.setItem('sw_reloaded', 'true');
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

