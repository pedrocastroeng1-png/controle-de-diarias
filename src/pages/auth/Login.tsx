import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { version } from '../../config/appVersion';
import { Loader2, User, Lock, ArrowRight, Building2, Users, Package, LineChart, MonitorDown, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { WhatsNewScreen } from '../../components/WhatsNewScreen';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const { login, usuario: authUsuario, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  useEffect(() => {
    const viewedVersion = localStorage.getItem('@diarias:whatsNewViewedVersion');
    if (viewedVersion !== version) {
      setShowWhatsNew(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && authUsuario) {
      if (authUsuario.perfil === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (authUsuario.perfil === 'CONSULTA') {
        navigate('/admin/relatorios', { replace: true });
      } else {
        navigate('/operador/presenca', { replace: true });
      }
    }
  }, [authLoading, authUsuario, navigate]);

  const handleContinueWhatsNew = () => {
    localStorage.setItem('@diarias:whatsNewViewedVersion', version);
    setShowWhatsNew(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Tenta login como Owner primeiro via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: senha
      });
      
      if (!error && data?.session?.user?.app_metadata?.platform_role === 'owner') {
        navigate('/owner');
        return;
      }
    } catch (e) {
      // Ignora erro do Supabase Auth e continua para login normal
    }


    const success = await login(usuario, senha);

    if (success) {
      const userStr = localStorage.getItem('@diarias:usuario');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.perfil === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.perfil === 'CONSULTA') {
          navigate('/admin/relatorios');
        } else {
          navigate('/operador/presenca');
        }
      }
    } else {
      setErro('Usuário ou senha inválidos.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B33] mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Carregando sessão...</p>
      </div>
    );
  }

  if (showWhatsNew) {
    return <WhatsNewScreen onContinue={handleContinueWhatsNew} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden font-sans bg-white selection:bg-[#0B1B33]/10 selection:text-[#0B1B33]">
      
      {/* BRAND PRESENTATION (Top on Mobile, Left on Desktop) */}
      <div className="relative flex flex-col justify-between bg-[#0B1B33] overflow-hidden 
                      h-[42dvh] md:h-full md:w-[45%] lg:w-[55%]
                      p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 shrink-0">
        
        {/* Architectural Background with luxo.png - Improved Visibility & Composition */}
        <div className="absolute inset-0 pointer-events-none z-0">
           <img src="/icons/luxo.png" alt="Engenharia e Construção" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.55] mix-blend-luminosity" />
           {/* Deep Navy Gradient Overlays */}
           <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B33]/95 via-[#0B1B33]/40 to-[#0B1B33]/95"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B33] via-transparent to-transparent opacity-90"></div>
           
           {/* Gold architectural accents & Geometry */}
           <div className="absolute top-[-20%] right-[15%] w-[1px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/70 to-transparent transform rotate-12"></div>
           <div className="absolute top-[-20%] right-[10%] w-[2px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/40 to-transparent transform rotate-12"></div>
           <div className="absolute top-[35%] left-[-10%] w-[150%] h-[1px] bg-white/[0.04] transform -rotate-6"></div>
           <div className="absolute bottom-[25%] right-[-10%] w-[150%] h-[1px] bg-[#C6922E]/[0.08] transform -rotate-6"></div>
        </div>
        
        {/* Top/Middle Content Wrapper to distribute space on mobile */}
        <div className="relative z-10 flex flex-col flex-1 justify-center md:justify-start">
          
          {/* Top Content: Icon */}
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out 
                          -ml-2 -mt-2 mb-2 md:-ml-6 md:-mt-6 md:mb-6 flex justify-center md:justify-start">
            <img src="/icons/icone2.png" alt="PCEG Icon" 
                 className="h-auto object-contain drop-shadow-2xl 
                            w-[130px] sm:w-[150px] md:w-[210px] lg:w-[240px] xl:w-[280px]" />
          </div>

          {/* Typography */}
          <div className="relative z-10 flex flex-col items-center md:items-start md:my-auto md:py-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150 ease-out fill-mode-both text-center md:text-left">
            <h1 className="text-white font-extrabold tracking-tight leading-none drop-shadow-lg mb-1 md:mb-2
                           text-[clamp(1.75rem,5vh,3rem)] md:text-5xl lg:text-6xl xl:text-7xl">
              PCEG
            </h1>
            <h2 className="text-[#C6922E] uppercase font-bold drop-shadow-md mb-2 md:mb-6
                           text-[clamp(0.5rem,1.5vh,0.7rem)] tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] md:text-[11px] lg:text-sm xl:text-base">
              Pedro Castro<br className="hidden md:block"/> <span className="md:hidden">Engenharia e Gestão</span><span className="hidden md:inline">Engenharia e Gestão</span>
            </h2>

            <div className="w-8 md:w-12 h-[2px] bg-[#C6922E] mb-2 md:mb-5"></div>
            <p className="text-white/90 font-light italic leading-relaxed drop-shadow-md
                          text-[clamp(0.7rem,1.8vh,0.9rem)] md:text-[15px] lg:text-lg xl:text-xl max-w-[200px] md:max-w-sm">
              "Gestão inteligente.<br className="hidden md:block" /> <span className="md:hidden">Obras eficientes."</span><span className="hidden md:inline">Obras eficientes."</span>
            </p>
          </div>
        </div>

        {/* Bottom Content: Modules (Hidden on mobile here, moved to the form container on mobile to save vertical space, or keep them here if it fits) */}
        {/* We will keep them here and use clamp for sizes to ensure they fit on mobile */}
        <div className="relative z-10 flex flex-row justify-center md:justify-start gap-4 sm:gap-6 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out fill-mode-both mt-auto pt-2 md:pt-0">
          <div className="flex flex-col items-center md:items-start opacity-90 group">
            <Building2 className="text-[#C6922E] w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mb-1 md:mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-white uppercase tracking-[0.1em] md:tracking-[0.15em] font-semibold">Obras</span>
          </div>
          <div className="flex flex-col items-center md:items-start opacity-90 group">
            <Users className="text-[#C6922E] w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mb-1 md:mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-white uppercase tracking-[0.1em] md:tracking-[0.15em] font-semibold">Equipe</span>
          </div>
          <div className="flex flex-col items-center md:items-start opacity-90 group">
            <Package className="text-[#C6922E] w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mb-1 md:mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-white uppercase tracking-[0.1em] md:tracking-[0.15em] font-semibold">Materiais</span>
          </div>
          <div className="flex flex-col items-center md:items-start opacity-90 group">
            <LineChart className="text-[#C6922E] w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mb-1 md:mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-white uppercase tracking-[0.1em] md:tracking-[0.15em] font-semibold">Resultados</span>
          </div>
        </div>
      </div>

      {/* LOGIN FORM (Bottom on Mobile, Right on Desktop) */}
      <div className="flex-1 flex flex-col relative bg-white md:bg-[#F8FAFC] overflow-hidden">
        
        {/* Container ensures no internal scrollbar, fits naturally in viewport */}
        <div className="w-full h-full max-w-[400px] mx-auto px-6 py-4 sm:py-6 md:py-8 flex flex-col justify-center animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
          
          <div className="flex flex-col h-full justify-center">
            {/* Desktop/Tablet Header Gold Accent */}
            <div className="hidden md:block w-8 h-1 bg-[#C6922E] mb-8"></div>

            {/* Login Header */}
            <div className="mb-4 sm:mb-6 text-center md:text-left">
              <h3 className="font-bold text-[#0B1B33] mb-1 tracking-tight text-[clamp(1.25rem,3vh,1.5rem)] md:text-2xl">
                Bem-vindo à PCEG
              </h3>
              <p className="text-gray-500 font-medium text-[clamp(0.75rem,1.8vh,0.875rem)] sm:text-[14px]">
                Acesse sua conta para continuar.
              </p>
            </div>

            <form className="space-y-3 sm:space-y-4 md:space-y-5 shrink-0" onSubmit={handleLogin}>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="usuario" className="block text-[clamp(10px,1.5vh,12px)] font-bold text-gray-700 mb-1 uppercase tracking-wide">E-mail ou Usuário</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <User className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]" />
                    </div>
                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      required
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="block w-full pl-10 pr-4 h-[clamp(42px,6vh,50px)] border border-gray-300 rounded-[8px] bg-white focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[clamp(13px,2vh,15px)] text-gray-900 font-medium transition-all shadow-sm"
                      placeholder="Seu e-mail ou usuário"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="senha" className="block text-[clamp(10px,1.5vh,12px)] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <Lock className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]" />
                    </div>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="block w-full pl-10 pr-4 h-[clamp(42px,6vh,50px)] border border-gray-300 rounded-[8px] bg-white focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[clamp(13px,2vh,15px)] text-gray-900 font-medium transition-all shadow-sm"
                      placeholder="Digite sua senha"
                    />
                  </div>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50/80 border-l-4 border-red-500 p-2 sm:p-3 rounded-r-md flex items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-4 h-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[12px] sm:text-[13px] font-medium text-red-700 leading-snug">{erro}</span>
                </div>
              )}

              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-between items-center px-4 sm:px-5 h-[clamp(44px,7vh,50px)] border border-transparent rounded-[8px] shadow-md text-[clamp(12px,1.8vh,14px)] font-bold text-white bg-[#0B1B33] hover:bg-[#15294A] hover:-translate-y-[1px] hover:shadow-lg focus:outline-none focus:ring-[2px] focus:ring-offset-2 focus:ring-[#0B1B33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-200 cursor-pointer tracking-wide group"
                >
                  {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-center pl-4 sm:pl-5">ENTRAR</span>
                      <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          
          {isDesktop && (isInstallable || isInstalled) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
              {isInstalled ? (
                <div className="flex items-center text-emerald-600 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">PCEG Instalado</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#C6922E] hover:text-[#B58529] uppercase tracking-wider transition-colors py-2 px-4 rounded-lg hover:bg-[#C6922E]/5"
                >
                  <MonitorDown className="w-4 h-4" />
                  Instalar PCEG no computador
                </button>
              ) : null}
            </div>
          )}
          <div className="mt-4 sm:mt-6 md:mt-8 text-center md:text-left shrink-0">

            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
              v{version} &copy; {new Date().getFullYear()} PCEG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
