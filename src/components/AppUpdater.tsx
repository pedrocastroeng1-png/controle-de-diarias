import React, { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { version } from '../config/appVersion';
import { UpdateScreen } from './UpdateScreen';

export function AppUpdater({ children }: { children: React.ReactNode }) {
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState(version);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
        // If we don't know the new version string yet, just append a '+' or mark as Nova
        setLatestVersion('Nova Atualização');
      }
    }
  }, [needRefresh, latestVersion]);

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
    // Reloads the page. If it's still outdated, the screen will appear again on load.
    window.location.reload();
  };

  if (isChecking && !isOutdated) {
    // We can show nothing while initially checking so it doesn't flash login if outdated
    // But since it's fast, we'll just return null initially if still checking
    return null;
  }

  if (isOutdated || needRefresh) {
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
