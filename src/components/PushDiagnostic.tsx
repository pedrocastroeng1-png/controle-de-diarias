import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export function PushDiagnostic() {
  const { usuario } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{
    permission: string;
    swRegistered: string;
    swScript: string;
    swScope: string;
    swState: string;
    swCount: number;
    vapid: string;
    firebaseInit: string;
    firebaseError: string;
    messagingInit: string;
    messagingError: string;
    getTokenExecuted: string;
    getTokenError: string;
    fcmTokenGenerated: string;
    registerExecuted: string;
    supabaseResult: string;
    supabaseErrorCode: string;
    supabaseErrorMsg: string;
    supabaseErrorDetails: string;
    supabaseErrorHint: string;
  } | null>(null);

  const runDiagnostic = async () => {
    setRunning(true);
    const res = {
      permission: 'unknown',
      swRegistered: 'NOT REGISTERED',
      swScript: '-',
      swScope: '-',
      swState: '-',
      swCount: 0,
      vapid: 'MISSING',
      firebaseInit: 'PENDING',
      firebaseError: '',
      messagingInit: 'PENDING',
      messagingError: '',
      getTokenExecuted: 'NOT EXECUTED',
      getTokenError: '',
      fcmTokenGenerated: 'NOT GENERATED',
      registerExecuted: 'NOT EXECUTED',
      supabaseResult: 'PENDING',
      supabaseErrorCode: '',
      supabaseErrorMsg: '',
      supabaseErrorDetails: '',
      supabaseErrorHint: ''
    };

    try {
      // 1. Permission
      res.permission = Notification.permission;

      // 2. Service Worker
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        res.swCount = regs.length;
        if (regs.length > 0) {
          const reg = regs[0];
          res.swRegistered = 'REGISTERED';
          const sw = reg.active || reg.waiting || reg.installing;
          if (sw) {
            res.swScript = sw.scriptURL;
            res.swState = sw.state;
          }
          res.swScope = reg.scope;
        }
      }

      // 3. VAPID
      res.vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY ? 'CONFIGURED' : 'MISSING';

      // 4. Firebase Init
      let messaging: any = null;
      try {
        const { initFirebase } = await import('../lib/firebase');
        const { getMessaging, getToken } = await import('firebase/messaging');
        const firebaseInstance = initFirebase();
        res.firebaseInit = 'OK';
        
        if (firebaseInstance.messaging) {
          messaging = firebaseInstance.messaging;
          res.messagingInit = 'OK';
        } else {
          res.messagingInit = 'ERRO - Missing config';
        }

        // 5. Get Token
        if (messaging && res.swRegistered === 'REGISTERED') {
          res.getTokenExecuted = 'EXECUTING';
          const registration = await navigator.serviceWorker.ready;
          
          try {
             const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
             });
             
             if (token) {
                res.fcmTokenGenerated = 'GENERATED';
                
                // 6. Register Push Device
                if (usuario?.id) {
                   res.registerExecuted = 'EXECUTED';
                   try {
                      await api.registerPushDevice(usuario.id, token, 'WEB');
                      res.supabaseResult = 'SUCCESS';
                   } catch (supErr: any) {
                      res.supabaseResult = 'FAILED';
                      res.supabaseErrorCode = supErr?.code || 'UNKNOWN';
                      res.supabaseErrorMsg = supErr?.message || String(supErr);
                      res.supabaseErrorDetails = supErr?.details || '';
                      res.supabaseErrorHint = supErr?.hint || '';
                   }
                } else {
                   res.registerExecuted = 'NOT EXECUTED (No user ID)';
                }
             } else {
                res.fcmTokenGenerated = 'EMPTY';
             }
          } catch (tokenErr: any) {
             res.fcmTokenGenerated = 'ERROR';
             res.getTokenError = tokenErr?.message || String(tokenErr);
          }
        }
        
      } catch (fbErr: any) {
         res.firebaseInit = 'ERRO';
         res.firebaseError = fbErr?.message || String(fbErr);
      }
      
    } catch (e: any) {
      console.error(e);
    }

    setResults(res);
    setRunning(false);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white my-8 border border-slate-700 font-mono text-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100">Diagnóstico do Push (ADMIN)</h2>
        </div>
        <button 
          onClick={runDiagnostic}
          disabled={running}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Rodando...' : 'Executar Diagnóstico'}
        </button>
      </div>

      {results ? (
        <div className="space-y-4">
          <Section title="Permissão & SW">
            <Row label="Notification Permission" value={results.permission} highlight={results.permission !== 'granted'} />
            <Row label="Service Worker" value={results.swRegistered} highlight={results.swRegistered !== 'REGISTERED'} />
            {results.swRegistered === 'REGISTERED' && (
              <>
                <Row label="SW Count" value={results.swCount.toString()} />
                <Row label="SW Script URL" value={results.swScript} />
                <Row label="SW Scope" value={results.swScope} />
                <Row label="SW State" value={results.swState} />
              </>
            )}
          </Section>

          <Section title="Firebase">
            <Row label="VAPID" value={results.vapid} highlight={results.vapid !== 'CONFIGURED'} />
            <Row label="Firebase Init" value={results.firebaseInit} highlight={results.firebaseInit !== 'OK'} />
            {results.firebaseError && <Row label="Firebase Error" value={results.firebaseError} isError />}
            <Row label="getMessaging()" value={results.messagingInit} highlight={results.messagingInit !== 'OK'} />
          </Section>

          <Section title="Token & Registro">
            <Row label="getToken()" value={results.getTokenExecuted} />
            <Row label="FCM Token" value={results.fcmTokenGenerated} highlight={results.fcmTokenGenerated !== 'GENERATED'} />
            {results.getTokenError && <Row label="Token Error" value={results.getTokenError} isError />}
            
            <Row label="registerPushDevice()" value={results.registerExecuted} />
            <Row label="Supabase Registration" value={results.supabaseResult} highlight={results.supabaseResult !== 'SUCCESS' && results.supabaseResult !== 'PENDING'} />
            
            {results.supabaseResult === 'FAILED' && (
              <div className="mt-2 p-3 bg-red-950 border border-red-800 rounded text-red-200 text-xs break-all space-y-1">
                <p><span className="font-bold opacity-75">Code:</span> {results.supabaseErrorCode}</p>
                <p><span className="font-bold opacity-75">Message:</span> {results.supabaseErrorMsg}</p>
                {results.supabaseErrorDetails && <p><span className="font-bold opacity-75">Details:</span> {results.supabaseErrorDetails}</p>}
                {results.supabaseErrorHint && <p><span className="font-bold opacity-75">Hint:</span> {results.supabaseErrorHint}</p>}
              </div>
            )}
          </Section>
        </div>
      ) : (
        <div className="text-slate-400 text-center py-8">
          Clique no botão acima para iniciar o diagnóstico na máquina local.
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, isError }: { label: string, value: string, highlight?: boolean, isError?: boolean }) {
  let valColor = 'text-slate-300';
  if (highlight) valColor = 'text-amber-400 font-bold';
  if (isError) valColor = 'text-red-400 font-bold';
  if (value === 'OK' || value === 'SUCCESS' || value === 'GENERATED' || value === 'REGISTERED') valColor = 'text-emerald-400 font-bold';

  return (
    <div className="flex justify-between items-center border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right break-all ml-4 ${valColor}`}>{value}</span>
    </div>
  );
}
