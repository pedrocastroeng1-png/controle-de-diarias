import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Handle SW messages for 404 asset
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ASSET_404_RELOAD') {
      console.warn('ASSET_404_RELOAD recebido do SW, ignorando reload forçado.');
    }
  });
}

// 8. Verify imported asset on startup
async function verifyAssets() {
  if (sessionStorage.getItem('asset_checked')) return;
  try {
    // Avoid cache-busting HEAD requests that might fail offline or be mishandled by SW.
    // The Service Worker is reliable now that we don't manually delete its caches.
    const res = await fetch('/icons/icon1.png', { method: 'HEAD' });
    if (res.status === 404) {
      console.warn('Core asset 404 detected, but we will let the SW recover naturally.');
      // We no longer aggressively purge caches here to avoid destroying a newly installed SW's precache
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
