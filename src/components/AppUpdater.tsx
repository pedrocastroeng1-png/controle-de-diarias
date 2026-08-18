import React, { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from 'react-router-dom';
import { version } from '../config/appVersion';
import { UpdateScreen } from './UpdateScreen';

export function AppUpdater({ children }: { children: React.ReactNode }) {
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState(version);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const location = useLocation();
  const isOperadorPresenca = location.pathname.includes('/operador/presenca');

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 10 * 60 * 1000); // 10 mins
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') r.update();
        });
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== version) {
          setLatestVersion(data.version);
          setIsOutdated(true);
        }
      }
    } catch (e) {
      console.error('Failed to check version:', e);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkVersion();
    // Check every 10 minutes
    const interval = setInterval(checkVersion, 10 * 60 * 1000);
    
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkVersion]);

  // If SW indicates a new version is waiting
  useEffect(() => {
    if (needRefresh) {
      setIsOutdated(true);
      if (latestVersion === version) {
        // Fetch the actual latest version instead of using a placeholder text
        checkVersion();
      }
    }
  }, [needRefresh, latestVersion, checkVersion]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    
    try {
      // 1. Clear all caches (to be safe)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      
      // 2. If we have a pending SW update, apply it
      if (needRefresh) {
        await updateServiceWorker(true);
      } else {
        // Otherwise, if we have a new version.json but SW didn't trigger, force unregister SW and reload
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let reg of registrations) {
            await reg.unregister();
          }
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Update failed:', err);
      window.location.reload();
    }
  };

  const handleUpdateLater = () => {
    // Apenas oculta o aviso temporariamente, sem recarregar a página
    setIsOutdated(false);
    setNeedRefresh(false);
  };

  if (isChecking && !isOutdated) {
    // We can show nothing while initially checking so it doesn't flash login if outdated
    // But since it's fast, we'll just return null initially if still checking
    return null;
  }

  const hasUpdate = isOutdated || needRefresh;

  if (hasUpdate) {
    if (isOperadorPresenca) {
      return (
        <>
          {children}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[9999] flex flex-col sm:flex-row items-center gap-3 border border-blue-700 max-w-[90vw]">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-sm font-bold">Nova versão disponível</span>
              <span className="text-xs text-blue-200">Recomendamos atualizar para evitar erros.</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleUpdateNow}
                disabled={isUpdating}
                className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                {isUpdating ? 'Aguarde...' : 'Atualizar'}
              </button>
              <button 
                onClick={handleUpdateLater}
                className="flex-1 sm:flex-none bg-transparent hover:bg-blue-800 text-blue-200 px-3 py-2 rounded-lg text-sm transition-colors border border-blue-700"
              >
                Depois
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <UpdateScreen 
        latestVersion={latestVersion} 
        onUpdateNow={handleUpdateNow}
        onUpdateLater={handleUpdateLater}
        isUpdating={isUpdating}
      />
    );
  }

  return <>{children}</>;
}
