import React, { useEffect, useState } from 'react';


declare const __BUILD_VERSION__: string;

export default function Debug() {
  const [cacheVersion, setCacheVersion] = useState<string>('');
  const [swVersion, setSwVersion] = useState<string>('');
  const [clientsClaimed, setClientsClaimed] = useState<boolean>(false);
  
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(keys => setCacheVersion(keys.join(', ')));
    }
    if ('serviceWorker' in navigator) {
      setSwVersion(navigator.serviceWorker.controller ? navigator.serviceWorker.controller.state : 'No controller');
      
      navigator.serviceWorker.ready.then(reg => {
         if (reg.active) {
            setSwVersion(reg.active.state);
         }
      });
    }
  }, []);

  return (
    <div className="p-8 font-mono text-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">PWA Debug Page</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <strong className="text-gray-600 block mb-1">Current Build ID:</strong>
          <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
            {typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'dev'}
          </code>
        </div>
        
        <div>
          <strong className="text-gray-600 block mb-1">Current Caches:</strong>
          <code className="bg-gray-100 px-2 py-1 rounded text-green-600 break-all">
            {cacheVersion || 'None'}
          </code>
        </div>

        <div>
          <strong className="text-gray-600 block mb-1">SW Controller State:</strong>
          <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">
            {swVersion}
          </code>
        </div>

        <div>
          <strong className="text-gray-600 block mb-1">Current Logo Asset Path:</strong>
          <code className="bg-gray-100 px-2 py-1 rounded text-orange-600 break-all">
            {"/logo.png"}
          </code>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <strong className="text-gray-600 block mb-3">Logo Render Test:</strong>
          <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-200">
            <img src="/logo.png" alt="Rendered Logo Test" className="h-24 w-24 object-contain" />
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={async () => {
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) {
                  await reg.unregister();
                }
              }
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
          >
            Nuke Caches & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
