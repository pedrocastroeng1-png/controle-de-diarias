const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { version } from '../../config/appVersion';
import { Loader2, User, Lock, ArrowRight, Building2, Users, Package, LineChart } from 'lucide-react';
import { WhatsNewScreen } from '../../components/WhatsNewScreen';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const { login, usuario: authUsuario, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B33] mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Carregando sessão...</p>
      </div>
    );
  }

  if (showWhatsNew) {
    return <WhatsNewScreen onContinue={handleContinueWhatsNew} />;
  }

  return (
    <div className="flex min-h-[100dvh] font-sans bg-white selection:bg-[#0B1B33]/10 selection:text-[#0B1B33]">
      
      {/* LEFT SIDE - BRAND PRESENTATION (Tablet & Desktop) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[55%] relative bg-[#0B1B33] overflow-hidden flex-col justify-between p-8 lg:p-12 xl:p-16">
        
        {/* Architectural Background with luxo.png - Improved Visibility & Composition */}
        <div className="absolute inset-0 pointer-events-none z-0">
           <img src="/icons/luxo.png" alt="Engenharia e Construção" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.55] mix-blend-luminosity" />
           {/* Deep Navy Gradient Overlays - Let the center breathe so the image is visible */}
           <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B33]/95 via-[#0B1B33]/40 to-[#0B1B33]/95"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B33] via-transparent to-transparent opacity-90"></div>
           
           {/* Gold architectural accents & Geometry */}
           <div className="absolute top-[-20%] right-[15%] w-[1px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/70 to-transparent transform rotate-12"></div>
           <div className="absolute top-[-20%] right-[10%] w-[2px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/40 to-transparent transform rotate-12"></div>
           <div className="absolute top-[35%] left-[-10%] w-[150%] h-[1px] bg-white/[0.04] transform -rotate-6"></div>
           <div className="absolute bottom-[25%] right-[-10%] w-[150%] h-[1px] bg-[#C6922E]/[0.08] transform -rotate-6"></div>
        </div>
        
        {/* Top Content: Icon */}
        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">
          <img src="/icons/icone2.png" alt="PCEG Icon" className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain drop-shadow-2xl" />
        </div>

        {/* Middle Content: Typography (Better distributed vertically) */}
        <div className="relative z-10 flex flex-col items-start my-auto py-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150 ease-out fill-mode-both">
          <h1 className="text-white text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-2 leading-none drop-shadow-lg">
            PCEG
          </h1>
          <h2 className="text-[#C6922E] text-[11px] lg:text-sm xl:text-base uppercase tracking-[0.25em] font-bold mb-6 drop-shadow-md">
            Pedro Castro<br/>Engenharia e Gestão
          </h2>

          <div className="w-12 h-[2px] bg-[#C6922E] mb-5"></div>
          <p className="text-white/90 text-[15px] lg:text-lg xl:text-xl font-light italic leading-relaxed max-w-sm drop-shadow-md">
            "Gestão inteligente.<br />Obras eficientes."
          </p>
        </div>

        {/* Bottom Content: Modules */}
        <div className="relative z-10 flex flex-wrap gap-6 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out fill-mode-both">
          <div className="flex flex-col items-start opacity-90 group">
            <Building2 className="text-[#C6922E] w-5 h-5 lg:w-6 lg:h-6 mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Obras</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <Users className="text-[#C6922E] w-5 h-5 lg:w-6 lg:h-6 mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Equipe</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <Package className="text-[#C6922E] w-5 h-5 lg:w-6 lg:h-6 mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Materiais</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <LineChart className="text-[#C6922E] w-5 h-5 lg:w-6 lg:h-6 mb-2 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Resultados</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM (Mobile, Tablet & Desktop) */}
      <div className="flex-1 flex flex-col relative bg-white md:bg-[#F8FAFC]">
        
        {/* Container ensures no internal scrollbar, fits naturally in viewport */}
        <div className="w-full max-w-[400px] mx-auto px-6 py-8 flex flex-col justify-center min-h-[100dvh] md:min-h-0 md:h-full animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
          
          {/* Mobile Branding (Clean & Compact) */}
          <div className="md:hidden flex flex-col items-center text-center mb-6">
            <img src="/icons/icone2.png" alt="PCEG Icon" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-3 drop-shadow-sm" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-1">
              PCEG
            </h1>
            <h2 className="text-[#C6922E] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
              Pedro Castro Engenharia e Gestão
            </h2>
            <div className="w-8 h-[2px] bg-[#C6922E] rounded-full"></div>
          </div>

          <div className="flex flex-col">
            {/* Desktop/Tablet Header Gold Accent */}
            <div className="hidden md:block w-8 h-1 bg-[#C6922E] mb-8"></div>

            {/* Login Header */}
            <div className="mb-6 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#0B1B33] mb-1.5 tracking-tight">
                Bem-vindo à PCEG
              </h3>
              <p className="text-gray-500 font-medium text-[13px] sm:text-[14px]">
                Acesse sua conta para continuar.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="usuario" className="block text-[12px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                    Usuário
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <User className="h-[18px] w-[18px]" />
                    </div>
                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      required
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="block w-full pl-10 pr-4 h-[50px] border border-gray-300 rounded-[8px] bg-white focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[15px] text-gray-900 font-medium transition-all shadow-sm"
                      placeholder="Digite seu usuário"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="senha" className="block text-[12px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <Lock className="h-[18px] w-[18px]" />
                    </div>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="block w-full pl-10 pr-4 h-[50px] border border-gray-300 rounded-[8px] bg-white focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[15px] text-gray-900 font-medium transition-all shadow-sm"
                      placeholder="Digite sua senha"
                    />
                  </div>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50/80 border-l-4 border-red-500 p-3 rounded-r-md flex items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-4 h-4 mr-2.5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[13px] font-medium text-red-700 leading-snug">{erro}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-between items-center px-5 h-[50px] border border-transparent rounded-[8px] shadow-md text-[14px] font-bold text-white bg-[#0B1B33] hover:bg-[#15294A] hover:-translate-y-[1px] hover:shadow-lg focus:outline-none focus:ring-[2px] focus:ring-offset-2 focus:ring-[#0B1B33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-200 cursor-pointer tracking-wide group"
                >
                  {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-center pl-5">ENTRAR</span>
                      <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center md:text-left">
            <p className="text-[11px] text-gray-400 font-medium">
              v{version} &copy; {new Date().getFullYear()} PCEG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');
console.log("Login final polish applied.");
