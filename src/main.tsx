import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Handle SW messages for 404 asset
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ASSET_404_RELOAD') {
      window.location.reload();
    }
  });
}

// 8. Verify imported asset on startup
async function verifyAssets() {
  if (sessionStorage.getItem('asset_checked')) return;
  try {
    const res = await fetch('/logo.png', { method: 'HEAD', cache: 'no-cache' });
    if (res.status === 404) {
      console.error('Core asset 404. Purging caches...');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }
      sessionStorage.setItem('asset_checked', 'failed');
      window.location.reload();
    } else {
      sessionStorage.setItem('asset_checked', 'ok');
    }
  } catch (e) {
    console.error('Asset check failed:', e);
  }
}

verifyAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
