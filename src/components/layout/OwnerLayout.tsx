import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Home, Building2, CreditCard, Layers, ShieldCheck, List, Menu, X, ArrowLeft } from 'lucide-react';

export function OwnerLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.app_metadata?.platform_role !== 'owner') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: Home },
    { name: 'Empresas', path: '/owner/empresas', icon: Building2 },
    { name: 'Assinaturas', path: '/owner/assinaturas', icon: ShieldCheck },
    { name: 'Pagamentos', path: '/owner/pagamentos', icon: CreditCard },
    { name: 'Planos', path: '/owner/planos', icon: Layers },
    { name: 'Atualizações', path: '/owner/atualizacoes', icon: List },
    { name: 'Auditoria', path: '/owner/auditoria', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">PCEG Admin</h1>
            <p className="text-xs text-indigo-300">Software Owner Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-indigo-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-indigo-800 text-white' 
                      : 'text-indigo-100 hover:bg-indigo-800/50'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-300' : 'text-indigo-300/70'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-indigo-800 shrink-0">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{session.user.user_metadata?.name || 'Pedro Castro'}</p>
            <p className="text-xs text-indigo-300 truncate">{session.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do painel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-gray-900">PCEG Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
