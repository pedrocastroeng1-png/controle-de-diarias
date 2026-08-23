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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B33] mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Carregando sessão...</p>
      </div>
    );
  }

  if (showWhatsNew) {
    return <WhatsNewScreen onContinue={handleContinueWhatsNew} />;
  }

  return (
    <div className="flex min-h-screen font-sans bg-white selection:bg-[#0B1B33]/10 selection:text-[#0B1B33]">
      
      {/* LEFT SIDE - BRAND PRESENTATION (Desktop & Tablet) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[55%] relative bg-[#0B1B33] overflow-hidden flex-col justify-between">
        
        {/* Geometric/Architectural Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
           {/* Diagonal slice effect */}
           <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-[#15294A] to-transparent opacity-60 transform origin-top-right -rotate-12 translate-x-[20%]"></div>
           {/* Gold accent lines */}
           <div className="absolute top-[-20%] right-[10%] w-[1px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/40 to-transparent transform rotate-12"></div>
           <div className="absolute top-[-20%] right-[5%] w-[2px] h-[150%] bg-gradient-to-b from-transparent via-[#C6922E]/20 to-transparent transform rotate-12"></div>
           {/* Subtle Grid */}
           <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: \`linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)\`,
              backgroundSize: '64px 64px',
            }}
          ></div>
        </div>
        
        {/* Top Content: Branding */}
        <div className="relative z-10 p-10 lg:p-16 xl:p-24 flex flex-col items-start mt-4 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">
          <img src="/icons/icone2.png" alt="PCEG Icon" className="w-28 h-28 xl:w-36 xl:h-36 object-contain drop-shadow-2xl mb-8" />
          
          <h1 className="text-white text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-2 leading-none">
            PCEG
          </h1>
          <h2 className="text-[#C6922E] text-sm lg:text-base xl:text-lg uppercase tracking-[0.25em] font-bold mb-10">
            Pedro Castro<br/>Engenharia e Gestão
          </h2>

          <div className="w-16 h-[2px] bg-[#C6922E] mb-6"></div>
          <p className="text-white/80 text-lg lg:text-xl font-light italic leading-relaxed max-w-md">
            "Gestão inteligente.<br />Obras eficientes."
          </p>
        </div>

        {/* Bottom Content: SaaS Features / Metrics */}
        <div className="relative z-10 px-10 lg:px-16 xl:px-24 pb-12 flex gap-8 lg:gap-12 mt-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out fill-mode-both">
          <div className="flex flex-col items-start opacity-90 group">
            <Building2 className="text-[#C6922E] w-6 h-6 mb-3 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Obras</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <Users className="text-[#C6922E] w-6 h-6 mb-3 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Equipe</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <Package className="text-[#C6922E] w-6 h-6 mb-3 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Materiais</span>
          </div>
          <div className="flex flex-col items-start opacity-90 group">
            <LineChart className="text-[#C6922E] w-6 h-6 mb-3 transition-transform group-hover:-translate-y-1" />
            <span className="text-[10px] lg:text-[11px] text-white uppercase tracking-[0.15em] font-semibold">Resultados</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM (Mobile, Tablet & Desktop) */}
      <div className="flex-1 flex flex-col relative justify-center bg-white">
        
        <div className="w-full max-w-[440px] mx-auto p-6 sm:p-10 z-10 flex flex-col h-full md:h-auto justify-between md:justify-center animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
          
          {/* Mobile Branding (Hidden on Tablet/Desktop) */}
          <div className="md:hidden flex flex-col items-center text-center mt-6 mb-10">
            <img src="/icons/icone2.png" alt="PCEG Icon" className="w-28 h-28 object-contain mb-4 drop-shadow-sm" />
            <h1 className="text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-1">
              PCEG
            </h1>
            <h2 className="text-[#C6922E] text-[10px] uppercase tracking-[0.2em] font-bold mb-5">
              Pedro Castro Engenharia e Gestão
            </h2>
            <div className="w-12 h-1 bg-[#C6922E] rounded-full"></div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Desktop/Tablet Header Gold Accent */}
            <div className="hidden md:block w-10 h-1 bg-[#C6922E] mb-8"></div>

            {/* Login Header */}
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0B1B33] mb-2 tracking-tight">
                Bem-vindo à PCEG
              </h3>
              <p className="text-gray-500 font-medium text-sm sm:text-[15px]">
                Acesse sua conta para continuar.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="usuario" className="block text-[13px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Usuário
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      required
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="block w-full pl-11 pr-4 h-[54px] border border-gray-300 rounded-[10px] bg-white focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[15px] text-gray-900 font-medium transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="Digite seu usuário"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="senha" className="block text-[13px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0B1B33] transition-colors duration-300">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="block w-full pl-11 pr-4 h-[54px] border border-gray-300 rounded-[10px] bg-white focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#0B1B33]/10 focus:border-[#0B1B33] text-[15px] text-gray-900 font-medium transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="Digite sua senha"
                    />
                  </div>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50/80 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[14px] font-medium text-red-700 leading-snug">{erro}</span>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-between items-center px-6 h-[56px] border border-transparent rounded-[10px] shadow-lg text-[15px] font-bold text-white bg-[#0B1B33] hover:bg-[#15294A] hover:-translate-y-[1px] hover:shadow-xl focus:outline-none focus:ring-[3px] focus:ring-offset-2 focus:ring-[#0B1B33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg transition-all duration-200 cursor-pointer tracking-wide group"
                >
                  {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-center pl-6">ENTRAR</span>
                      <ArrowRight className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Bottom Decorative Icons (Hidden on Tablet/Desktop) */}
          <div className="md:hidden mt-12 mb-2 flex justify-center gap-6 border-t border-gray-100 pt-6">
            <div className="flex flex-col items-center">
              <Building2 className="text-[#C6922E] w-5 h-5 mb-1.5" />
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Obras</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="text-[#C6922E] w-5 h-5 mb-1.5" />
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Equipe</span>
            </div>
            <div className="flex flex-col items-center">
              <Package className="text-[#C6922E] w-5 h-5 mb-1.5" />
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Materiais</span>
            </div>
            <div className="flex flex-col items-center">
              <LineChart className="text-[#C6922E] w-5 h-5 mb-1.5" />
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Resultados</span>
            </div>
          </div>

          <div className="mt-8 md:mt-12 text-center md:text-left">
            <p className="text-[12px] text-gray-400 font-medium">
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
console.log("Written Login.tsx successfully");
