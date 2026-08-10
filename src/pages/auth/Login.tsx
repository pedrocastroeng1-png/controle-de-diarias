import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { version } from '../../config/appVersion';
import { Loader2, User, Lock } from 'lucide-react';
import { WhatsNewScreen } from '../../components/WhatsNewScreen';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const viewedVersion = localStorage.getItem('@diarias:whatsNewViewedVersion');
    if (viewedVersion !== version) {
      setShowWhatsNew(true);
    }
  }, []);

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
        } else {
          navigate('/operador/presenca');
        }
      }
    } else {
      setErro('Usuário ou senha inválidos.');
      setLoading(false);
    }
  };

  if (showWhatsNew) {
    return <WhatsNewScreen onContinue={handleContinueWhatsNew} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* Subtle Radial Background Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-70"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px] w-full px-4 sm:px-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        
        <div className="bg-white p-[32px] sm:p-[48px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.06)] rounded-[28px] border-none">
          
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-8">
              <img src="/logo.png" alt="Controle de Diárias" className="h-[96px] w-[96px] object-contain" />
            </div>
            
            <h2 className="text-[32px] sm:text-[42px] leading-tight font-extrabold text-[#0F172A] tracking-tight">
              Controle de Diárias
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#64748B] font-medium leading-relaxed max-w-[320px] mx-auto">
              Controle inteligente de equipes e presença em obras.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="usuario" className="sr-only">
                Usuário
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                  <User className="h-[22px] w-[22px]" />
                </div>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="block w-full pl-[46px] pr-4 h-[58px] border border-[#E2E8F0] rounded-[16px] placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[16px] transition-all duration-300 bg-white font-medium text-slate-900 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  placeholder="Usuário"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="sr-only">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                  <Lock className="h-[22px] w-[22px]" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-[46px] pr-4 h-[58px] border border-[#E2E8F0] rounded-[16px] placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[16px] transition-all duration-300 bg-white font-medium text-slate-900 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  placeholder="Senha"
                />
              </div>
            </div>

            {erro && (
              <div className="text-[14px] text-red-600 bg-red-50/80 border border-red-100 p-4 rounded-[16px] flex items-center shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 mt-5">
                <svg className="w-5 h-5 mr-2.5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{erro}</span>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center h-[58px] border border-transparent rounded-[16px] shadow-[0_4px_12px_rgba(37,99,235,0.25)] text-[16px] font-bold text-white bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] focus:outline-none focus:ring-[3px] focus:ring-offset-2 focus:ring-[#2563EB]/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-250 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[13px] text-slate-400 font-medium">
              v{version}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
