import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export function PushDiagnostic() {
  const { usuario } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const runDiagnostic = async () => {
    setRunning(true);
    setExpanded(true);
    let res: any = {
      permission: 'PENDING',
      swRegistered: 'PENDING',
      swCount: 0,
      swScript: '',
      swScope: '',
      swState: '',
      envApiKey: 'PENDING',
      envAuthDomain: 'PENDING',
      envProjectId: 'PENDING',
      envStorage: 'PENDING',
      envSenderId: 'PENDING',
      envAppId: 'PENDING',
      vapid: 'PENDING',
      firebaseInit: 'PENDING',
      firebaseError: '',
      messagingInit: 'PENDING',
      getTokenExecuted: 'PENDING',
      fcmTokenGenerated: 'PENDING',
      getTokenError: '',
      registerExecuted: 'PENDING',
      supabaseResult: 'PENDING',
      supabaseErrorCode: '',
      supabaseErrorMsg: '',
      supabaseErrorDetails: '',
      supabaseErrorHint: '',
    };

    try {
      res.permission = Notification.permission;
      
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        res.swCount = regs.length;
        if (regs.length > 0) {
          res.swRegistered = 'REGISTERED';
          res.swScript = regs[0].active?.scriptURL || 'N/A';
          res.swScope = regs[0].scope || 'N/A';
          res.swState = regs[0].active?.state || 'N/A';
        } else {
          res.swRegistered = 'NOT REGISTERED';
        }
      }

      res.envApiKey = import.meta.env.VITE_FIREBASE_API_KEY ? 'PRESENT' : 'MISSING';
      res.envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'PRESENT' : 'MISSING';
      res.envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'PRESENT' : 'MISSING';
      res.envStorage = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'PRESENT' : 'MISSING';
      res.envSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'PRESENT' : 'MISSING';
      res.envAppId = import.meta.env.VITE_FIREBASE_APP_ID ? 'PRESENT' : 'MISSING';
      res.vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY ? 'CONFIGURED' : 'MISSING';

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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4">
        <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <ShieldAlert className="w-5 h-5 text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-bold text-[#0B1B33] uppercase tracking-wide truncate">Diagnóstico do Push</h2>
            <p className="text-[12px] text-gray-500 font-medium truncate">Verifique o status das notificações (ADMIN).</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {results && (
             <button
               onClick={() => setExpanded(!expanded)}
               className="p-2 text-gray-400 hover:text-[#0B1B33] hover:bg-gray-100 rounded-lg transition-colors"
               title={expanded ? "Recolher detalhes" : "Ver detalhes"}
             >
               {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
             </button>
          )}
          <button 
            onClick={runDiagnostic}
            disabled={running}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[#0B1B33] hover:bg-[#15294A] text-white px-4 py-2 sm:py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Rodando...' : 'Executar Diagnóstico'}
          </button>
        </div>
      </div>

      {results && expanded && (
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 font-mono text-[11px] sm:text-[12px] text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Section title="Permissão & SW">
              <Row label="Permissão" value={results.permission} highlight={results.permission !== 'granted'} />
              <Row label="Service Worker" value={results.swRegistered} highlight={results.swRegistered !== 'REGISTERED'} />
              {results.swRegistered === 'REGISTERED' && (
                <>
                  <Row label="Script URL" value={results.swScript} />
                  <Row label="State" value={results.swState} />
                </>
              )}
            </Section>
            
            <Section title="Firebase">
              <Row label="Firebase Init" value={results.firebaseInit} highlight={results.firebaseInit !== 'OK'} />
              {results.firebaseError && <Row label="Firebase Error" value={results.firebaseError} isError />}
              <Row label="getMessaging()" value={results.messagingInit} highlight={results.messagingInit !== 'OK'} />
              <Row label="VAPID_KEY" value={results.vapid} highlight={results.vapid !== 'CONFIGURED'} />
            </Section>
            
            <Section title="Token & Registro">
              <Row label="getToken()" value={results.getTokenExecuted} />
              <Row label="FCM Token" value={results.fcmTokenGenerated} highlight={results.fcmTokenGenerated !== 'GENERATED'} />
              {results.getTokenError && <Row label="Token Error" value={results.getTokenError} isError />}
              <Row label="registerPushDevice()" value={results.registerExecuted} />
              <Row label="Supabase" value={results.supabaseResult} highlight={results.supabaseResult !== 'SUCCESS' && results.supabaseResult !== 'PENDING'} />
            </Section>
          </div>
          
          {results.supabaseResult === 'FAILED' && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] break-words space-y-1">
               <p><span className="font-bold">Code:</span> {results.supabaseErrorCode}</p>
               <p><span className="font-bold">Message:</span> {results.supabaseErrorMsg}</p>
               {results.supabaseErrorDetails && <p><span className="font-bold">Details:</span> {results.supabaseErrorDetails}</p>}
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm overflow-hidden">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">{title}</h3>
      <div className="space-y-1.5 min-w-0">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, isError }: { label: string, value: string, highlight?: boolean, isError?: boolean }) {
  let valColor = 'text-slate-600';
  if (highlight) valColor = 'text-amber-600 font-bold';
  if (isError) valColor = 'text-red-600 font-bold';
  if (value === 'OK' || value === 'SUCCESS' || value === 'GENERATED' || value === 'REGISTERED') valColor = 'text-emerald-600 font-bold';
  
  return (
    <div className="flex justify-between items-start sm:items-center gap-2">
      <span className="text-slate-500 flex-shrink-0 whitespace-nowrap">{label}</span>
      <span className={`text-right break-words min-w-0 ${valColor}`}>{value}</span>
    </div>
  );
}
