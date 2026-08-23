const fs = require('fs');

const code = `import React from 'react';
import { version } from '../config/appVersion';
import { Loader2, MonitorDown, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface UpdateScreenProps {
  latestVersion: string;
  onUpdateNow: () => void;
  onUpdateLater: () => void;
  isUpdating: boolean;
}

export function UpdateScreen({ latestVersion, onUpdateNow, onUpdateLater, isUpdating }: UpdateScreenProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // Desktop detection
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#0B1B33] flex flex-col justify-center items-center px-4 sm:px-6 font-sans relative z-[9999] selection:bg-white/10">
      
      {/* Background Architectural Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src="/icons/luxo.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B33] via-[#0B1B33]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1B33] via-transparent to-transparent"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center animate-in fade-in zoom-in-[0.98] duration-700 ease-out fill-mode-both">
        
        {/* Card Container */}
        <div className="w-full bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
          
          <div className="flex justify-center mb-6">
            <img src="/icons/icone2.png" alt="PCEG Logo" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] object-contain drop-shadow-md" />
          </div>

          <div className="mb-2">
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 border border-[#C6922E]/30 bg-[#C6922E]/10 rounded-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#B58529]">
              Versão {latestVersion}
            </span>
          </div>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#0B1B33] tracking-tight mb-3">
            NOVA ATUALIZAÇÃO
          </h2>

          <p className="text-[14px] sm:text-[15px] font-bold text-gray-700 mb-1">
            Uma nova versão do PCEG está disponível.
          </p>
          
          <p className="text-[13px] sm:text-[14px] text-gray-500 leading-relaxed mb-8 max-w-[320px]">
            Atualize para receber as melhorias, correções e novos recursos.
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={onUpdateNow}
              disabled={isUpdating}
              className="w-full flex justify-center items-center h-[52px] sm:h-[56px] rounded-xl text-[14px] sm:text-[15px] font-bold text-white bg-[#0B1B33] hover:bg-[#15294A] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide"
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
              className="w-full flex justify-center items-center h-[46px] sm:h-[50px] rounded-xl text-[13px] sm:text-[14px] font-bold text-gray-500 hover:text-[#0B1B33] hover:bg-gray-50 transition-all uppercase tracking-wide"
            >
              Atualizar depois
            </button>
          </div>
          
          {/* Desktop PWA Install Action */}
          {isDesktop && (
            <div className="w-full mt-6 pt-5 border-t border-gray-100 flex flex-col items-center">
              {isInstalled ? (
                <div className="flex items-center text-emerald-600 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">PCEG Instalado no Computador</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={promptInstall}
                  className="flex items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#C6922E] hover:text-[#B58529] uppercase tracking-wider transition-colors py-2 px-4 rounded-lg hover:bg-[#C6922E]/5"
                >
                  <MonitorDown className="w-4 h-4" />
                  Instalar PCEG no computador
                </button>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/UpdateScreen.tsx', code);
console.log("Patched UpdateScreen.tsx");
