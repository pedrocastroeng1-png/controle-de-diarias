import React from 'react';
import { version } from '../config/appVersion';

interface WhatsNewScreenProps {
  onContinue: () => void;
}

export function WhatsNewScreen({ onContinue }: WhatsNewScreenProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900 relative z-[9999]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-70"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px] w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both">
        <div className="bg-white p-[32px] sm:p-[48px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.06)] rounded-[28px] border-none flex flex-col items-center text-center">
          
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Controle de Diárias" className="h-[80px] w-[80px] object-contain drop-shadow-sm" />
          </div>
          
          <h2 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-2">
            🚀 Controle de Diárias
          </h2>
          
          <div className="mb-6">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
              Versão {version}
            </span>
          </div>
          
          <p className="text-[15px] sm:text-[16px] text-[#64748B] font-medium leading-relaxed mb-8">
            Confira as novidades desta atualização.
          </p>

          <div className="w-full text-left space-y-4 mb-10">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <span className="text-[15px] font-semibold text-slate-700">Nova identidade visual</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📸</span>
              <span className="text-[15px] font-semibold text-slate-700">Fotos dos funcionários</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <span className="text-[15px] font-semibold text-slate-700">Auditoria com imagens</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <span className="text-[15px] font-semibold text-slate-700">Melhor desempenho</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <span className="text-[15px] font-semibold text-slate-700">Melhor experiência no iPhone</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <span className="text-[15px] font-semibold text-slate-700">Correções de bugs e estabilidade</span>
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={onContinue}
              className="w-full flex justify-center items-center h-[58px] border border-transparent rounded-[16px] shadow-[0_4px_12px_rgba(37,99,235,0.25)] text-[16px] font-bold text-white bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] focus:outline-none focus:ring-[3px] focus:ring-offset-2 focus:ring-[#2563EB]/50 transition-all duration-250 cursor-pointer"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
