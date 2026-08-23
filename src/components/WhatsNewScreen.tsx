import React from 'react';
import { version } from '../config/appVersion';
import { Palette, Users, ShieldCheck, Zap, Smartphone, Settings, ArrowRight } from 'lucide-react';

interface WhatsNewScreenProps {
  onContinue: () => void;
}

export function WhatsNewScreen({ onContinue }: WhatsNewScreenProps) {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden font-sans bg-white selection:bg-[#0B1B33]/10 selection:text-[#0B1B33]">
      
      {/* LEFT SIDE - BRAND PRESENTATION (Top on mobile, left on desktop) */}
      <div className="relative flex flex-col justify-center bg-[#0B1B33] overflow-hidden 
                      h-[35dvh] sm:h-[40dvh] md:h-full md:w-[45%] lg:w-[50%]
                      p-6 sm:p-8 md:p-12 lg:p-16 shrink-0">
        
        {/* Architectural Background with luxo.png */}
        <div className="absolute inset-0 pointer-events-none z-0">
           <img src="/icons/luxo.png" alt="Construção PCEG" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.35] mix-blend-luminosity" />
           <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B33]/95 via-[#0B1B33]/60 to-[#0B1B33]/95"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B33] via-transparent to-transparent opacity-90"></div>
           
           {/* Gold architectural accents */}
           <div className="absolute top-[-20%] right-[15%] w-[1px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/50 to-transparent transform rotate-12"></div>
           <div className="absolute bottom-[20%] left-[-10%] w-[150%] h-[1px] bg-[#C6922E]/[0.05] transform -rotate-6"></div>
        </div>
        
        {/* Brand Content */}
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left animate-in fade-in slide-in-from-left-8 duration-1000 ease-out fill-mode-both">
          <div className="flex justify-center md:justify-start -ml-2 mb-2 md:-ml-4 md:mb-6">
             <img src="/icons/icone2.png" alt="PCEG Icon" 
                  className="w-[80px] sm:w-[100px] md:w-[150px] lg:w-[180px] h-auto object-contain drop-shadow-2xl" />
          </div>
          
          <h1 className="text-white font-extrabold tracking-tight leading-none drop-shadow-lg mb-1 md:mb-2
                         text-[clamp(1.5rem,4vh,2.5rem)] md:text-5xl lg:text-6xl">
            PCEG
          </h1>
          <h2 className="text-[#C6922E] uppercase font-bold drop-shadow-md mb-2 md:mb-6
                         text-[clamp(0.55rem,1.5vh,0.7rem)] tracking-[0.2em] md:tracking-[0.25em] md:text-sm lg:text-base">
            Pedro Castro<br className="hidden md:block"/> <span className="md:hidden">Engenharia e Gestão</span><span className="hidden md:inline">Engenharia e Gestão</span>
          </h2>
          
          <div className="hidden md:block w-12 h-[2px] bg-[#C6922E] mb-5"></div>
          
          <p className="hidden md:block text-white/90 font-light italic leading-relaxed drop-shadow-md
                        md:text-[15px] lg:text-lg max-w-sm">
            "Gestão inteligente.<br />Obras eficientes."
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - CONTENT */}
      <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
        
        <div className="w-full h-full max-w-[500px] lg:max-w-[600px] mx-auto px-6 py-4 sm:py-6 md:py-8 flex flex-col justify-between md:justify-center animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
          
          <div className="flex flex-col flex-1 justify-center shrink-0">
            {/* Header */}
            <div className="mb-4 sm:mb-6 text-center md:text-left">
               <div className="inline-flex items-center justify-center md:justify-start px-2 py-1 mb-3 border border-[#C6922E]/30 bg-[#C6922E]/10 rounded-sm">
                 <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#B58529]">Versão {version}</span>
               </div>
               <h3 className="font-extrabold text-[#0B1B33] mb-2 tracking-tight leading-tight text-[clamp(1.2rem,3vh,1.75rem)] md:text-3xl lg:text-4xl">
                 Bem-vindo à<br className="hidden md:block"/> nova PCEG
               </h3>
               <p className="text-gray-500 font-medium text-[clamp(0.75rem,1.8vh,0.9rem)] md:text-base max-w-md mx-auto md:mx-0">
                 Uma nova experiência para tornar a gestão das suas obras mais simples, inteligente e eficiente.
               </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-6 mb-6 md:mb-8 shrink-0">
              <FeatureItem icon={Palette} title="Identidade" desc="Nova identidade visual PCEG" />
              <FeatureItem icon={Users} title="Equipe" desc="Fotos dos funcionários" />
              <FeatureItem icon={ShieldCheck} title="Segurança" desc="Auditoria com imagens" />
              <FeatureItem icon={Zap} title="Desempenho" desc="Mais velocidade e estabilidade" />
              <FeatureItem icon={Smartphone} title="Mobile" desc="Melhor experiência no iPhone" />
              <FeatureItem icon={Settings} title="Evolução" desc="Correções e melhorias contínuas" />
            </div>
          </div>

          <div className="pt-2 sm:pt-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onContinue}
              className="w-full flex justify-between items-center px-5 h-[clamp(44px,7vh,54px)] md:h-[54px] rounded-lg shadow-sm text-[clamp(12px,2vh,14px)] md:text-[14px] font-bold text-white bg-[#0B1B33] hover:bg-[#15294A] hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1B33] transition-all duration-200 cursor-pointer tracking-wide group"
            >
              <span className="flex-1 text-center pl-5">ACESSAR PLATAFORMA</span>
              <ArrowRight className="w-[18px] h-[18px] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                PCEG &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mt-0.5">
        <div className="flex items-center justify-center w-[clamp(24px,4vh,32px)] h-[clamp(24px,4vh,32px)] rounded-md bg-[#0B1B33]/5 text-[#C6922E]">
          <Icon className="w-[clamp(12px,2vh,16px)] h-[clamp(12px,2vh,16px)]" strokeWidth={2.5} />
        </div>
      </div>
      <div className="ml-3 sm:ml-4 flex flex-col justify-center">
        <h4 className="text-[clamp(10px,1.8vh,12px)] md:text-[13px] font-bold text-[#0B1B33] uppercase tracking-wide leading-none mb-1">{title}</h4>
        <p className="text-[clamp(11px,1.8vh,13px)] md:text-[14px] font-medium text-gray-500 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
