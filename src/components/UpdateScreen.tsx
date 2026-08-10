import React from 'react';
import { version } from '../config/appVersion';
import { Loader2 } from 'lucide-react';

interface UpdateScreenProps {
  latestVersion: string;
  onUpdateNow: () => void;
  onUpdateLater: () => void;
  isUpdating: boolean;
}

export function UpdateScreen({ latestVersion, onUpdateNow, onUpdateLater, isUpdating }: UpdateScreenProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900 relative z-[9999]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-70"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px] w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both">
        <div className="bg-white p-[32px] sm:p-[48px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.06)] rounded-[28px] border-none flex flex-col items-center text-center">
          
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="Controle de Diárias" className="h-[96px] w-[96px] object-contain drop-shadow-sm" />
          </div>
          
          <h2 className="text-[32px] sm:text-[36px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-4">
            Nova versão disponível
          </h2>
          
          <p className="text-[15px] sm:text-[16px] text-[#64748B] font-medium leading-relaxed mb-8">
            Uma nova versão do Controle de Diárias foi publicada.<br/><br/>
            Atualize agora para continuar utilizando o aplicativo com melhorias, correções e novos recursos.
          </p>

          <div className="flex justify-center items-center gap-6 mb-10 w-full px-4">
            <div className="flex flex-col items-center">
              <span className="text-[12px] uppercase tracking-wider font-bold text-slate-400 mb-1">Atual</span>
              <span className="text-[16px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{version}</span>
            </div>
            <div className="text-slate-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] uppercase tracking-wider font-bold text-blue-500 mb-1">Nova</span>
              <span className="text-[16px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{latestVersion}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={onUpdateNow}
              disabled={isUpdating}
              className="w-full flex justify-center items-center h-[58px] border border-transparent rounded-[16px] shadow-[0_4px_12px_rgba(37,99,235,0.25)] text-[16px] font-bold text-white bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] focus:outline-none focus:ring-[3px] focus:ring-offset-2 focus:ring-[#2563EB]/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-250 cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar agora'
              )}
            </button>
            <button
              onClick={onUpdateLater}
              disabled={isUpdating}
              className="w-full flex justify-center items-center h-[50px] rounded-[16px] text-[15px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-all duration-200 cursor-pointer"
            >
              Atualizar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
