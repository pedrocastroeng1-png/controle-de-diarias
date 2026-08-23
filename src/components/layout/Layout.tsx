
import { api } from '../../lib/api';
import { CommunicationViewer } from '../CommunicationViewer';
import { CentralCommunicationViewer } from '../CentralCommunicationViewer';

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheck, LogOut, Wrench, LayoutDashboard, HardHat, Briefcase, Users, FileText, Stethoscope, Megaphone, Camera, Bell, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MonitorDown, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { version } from '../../config/appVersion';
import { format } from 'date-fns';

export function AdminLayout() {
  const { usuario, logout, loading } = useAuth();
  const location = useLocation();

  const [unreadComms, setUnreadComms] = useState<any[]>([]);
  const [unreadCentralComms, setUnreadCentralComms] = useState<any[]>([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  useEffect(() => {
    if (loading) return;
    
    if (usuario) {
      Promise.all([
        api.getUnreadCommunications(usuario.id),
        api.getUnreadCentralCommunications(usuario.id)
      ]).then(([comms, centralComms]) => {
        setUnreadCentralComms(centralComms);
        setUnreadComms(comms);
        setLoadingComms(false);
      }).catch(err => {
        console.error(err);
        setLoadingComms(false);
      });
    } else {
      setLoadingComms(false);
    }
  }, [usuario, loading]);

  if (loading || loadingComms) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  
  if (usuario.perfil !== 'ADMIN' && usuario.perfil !== 'CONSULTA') {
    return <Navigate to="/operador/presenca" replace />;
  }

  // Block CONSULTA from unauthorized routes
  if (usuario.perfil === 'CONSULTA' && !location.pathname.startsWith('/admin/relatorios') && !location.pathname.startsWith('/admin/auditoria')) {
    return <Navigate to="/admin/relatorios" replace />;
  }

  if (unreadCentralComms.length > 0) {
    return <CentralCommunicationViewer communications={unreadCentralComms} onComplete={() => setUnreadCentralComms([])} />;
  }
  if (unreadComms.length > 0) {
    return <CommunicationViewer communications={unreadComms} onComplete={() => setUnreadComms([])} />;
  }

  
  const adminMenuGroups = [
    {
      section: 'VISÃO GERAL',
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      section: 'OPERAÇÃO',
      name: 'Obras',
      path: '/admin/obras',
      icon: HardHat
    },
    {
      name: 'Pessoas',
      icon: Users,
      items: [
        { name: 'Funcionários', path: '/admin/funcionarios' }
      ]
    },
    {
      name: 'Presença / Diárias',
      icon: ClipboardCheck,
      items: [
        { name: 'Presença', path: '/admin/presenca' },
        { name: 'Atestados', path: '/admin/atestados' },
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    },
    {
      name: 'Ferramentas',
      path: '/admin/ferramentas',
      icon: Wrench
    },
    {
      name: 'Materiais',
      path: '/admin/controle-materiais',
      icon: Package
    },
    {
      section: 'GESTÃO',
      name: 'Resultados / Relatórios',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'Comunicações',
      icon: Megaphone,
      items: [
        { name: 'Central de Comunicações', path: '/admin/central-comunicacoes' },
        { name: 'Automações', path: '/admin/automacoes' }
      ]
    },
    {
      section: 'ADMINISTRAÇÃO',
      name: 'Cadastros',
      icon: Briefcase,
      items: [
        { name: 'Funções', path: '/admin/funcoes' }
      ]
    }
  ];

  const consultaMenuGroups = [
    {
      section: 'GESTÃO',
      name: 'Resultados / Relatórios',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      section: 'OPERAÇÃO',
      name: 'Auditoria de Presenças',
      path: '/admin/auditoria',
      icon: ClipboardCheck
    }
  ];

  const menuGroups = usuario.perfil === 'CONSULTA' ? consultaMenuGroups : adminMenuGroups;

  const toggleGroup = (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupName);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex flex-shrink-0 z-10">
        <div className="h-[100px] flex items-center justify-center px-4 py-4 border-b border-gray-200 bg-white">
          <img src="/icons/icone2.png" alt="PCEG Logo" className="w-full max-w-[180px] max-h-full object-contain" />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuGroups.map((group, index) => {
            const Icon = group.icon;
            const isFirstInSection = group.section && (index === 0 || menuGroups[index - 1].section !== group.section);
            const sectionHeader = isFirstInSection ? (
              <div key={`section-${group.section}`} className="mt-6 mb-2 px-3 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                {group.section}
              </div>
            ) : null;
            if (group.path) {
              const isActive = location.pathname.startsWith(group.path);
              return (
                <React.Fragment key={group.path || group.name}>
                {sectionHeader}
                <Link
                  key={group.path}
                  to={group.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-[#0B1B33] text-white shadow-md" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1B33]"
                  )}
                >
                  <Icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-[#C6922E]" : "text-gray-400 group-hover:text-[#0B1B33]")} />
                  {group.name}
                </Link>
              </React.Fragment>
              );
            }

            const isExpanded = expandedGroup === group.name;
            const hasActiveChild = group.items?.some(item => 
              item.path.includes('?') 
                ? location.pathname + location.search === item.path
                : location.pathname.startsWith(item.path.split('?')[0])
            );

            return (
              <React.Fragment key={group.name}>
              {sectionHeader}
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    hasActiveChild && !isExpanded ? "bg-[#0B1B33]/5 text-[#0B1B33] font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1B33]"
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn("mr-3 h-5 w-5 transition-colors", hasActiveChild && !isExpanded ? "text-[#C6922E]" : "text-gray-400 group-hover:text-[#0B1B33]")} />
                    {group.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && group.items && (
                  <div className="pl-11 pr-3 space-y-1 py-1">
                    {group.items.map(item => {
                      const isItemActive = item.path.includes('?') 
                        ? location.pathname + location.search === item.path
                        : location.pathname === item.path;
                        
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "block px-3 py-2 rounded-md text-sm transition-colors",
                            isItemActive 
                              ? "bg-[#FDF9F1] text-[var(--color-pceg-gold)] font-medium" 
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              </React.Fragment>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-slate-50 mt-auto">
          <div className="flex items-center px-3 py-2 text-sm font-bold text-[#0B1B33]">
            <div className="flex-1 min-w-0">
              <div className="truncate">{usuario.usuario}</div>
              <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Administrador</div>
            </div>
          </div>

          {isDesktop && (isInstallable || isInstalled) && (
            <div className="mt-2 mb-2 w-full">
              {isInstalled ? (
                <div className="flex items-center justify-center px-3 py-2 text-xs font-medium text-emerald-600 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  PCEG Instalado
                </div>
              ) : (
                <button
                  onClick={promptInstall}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-[#C6922E] bg-[#C6922E]/10 hover:bg-[#C6922E]/20 transition-colors uppercase tracking-wider"
                >
                  <MonitorDown className="w-4 h-4" />
                  Instalar no PC
                </button>
              )}
            </div>
          )}
          <button
            onClick={logout}

            className="mt-2 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            PCEG<br/>
            Versão {version}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-3 md:hidden">
           <img src="/icons/icone2.png" alt="PCEG Logo" className="h-10 w-auto object-contain" />
           <h1 className="text-xl font-bold text-gray-900 flex-1">PCEG</h1>
           <button onClick={logout} className="text-gray-500 hover:text-red-600">
             <LogOut className="h-6 w-6" />
           </button>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function OperadorLayout() {
  const { usuario, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [unreadComms, setUnreadComms] = useState<any[]>([]);
  const [unreadCentralComms, setUnreadCentralComms] = useState<any[]>([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [presencaHojeConcluida, setPresencaHojeConcluida] = useState(false);
  const [checkingPresenca, setCheckingPresenca] = useState(true);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  useEffect(() => {
    if (loading) return;
    
    if (usuario && usuario.perfil === 'OPERADOR') {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      Promise.all([
        api.getUnreadCommunications(usuario.id),
        api.getUnreadCentralCommunications(usuario.id),
        api.getPresencas(hoje)
      ]).then(([comms, centralComms, presencas]) => {
        setUnreadCentralComms(centralComms);
        setUnreadComms(comms);
        setPresencaHojeConcluida(presencas.length > 0);
        setLoadingComms(false);
        setCheckingPresenca(false);
      }).catch(err => {
        console.error(err);
        setLoadingComms(false);
        setCheckingPresenca(false);
      });
    } else {
      setLoadingComms(false);
      setCheckingPresenca(false);
    }
  }, [usuario, loading]);

  useEffect(() => {
    if (loading) return;
    
    if (!checkingPresenca) {
      if (!presencaHojeConcluida && location.pathname !== '/operador/presenca') {
        navigate('/operador/presenca', { replace: true });
      }
    }
  }, [checkingPresenca, presencaHojeConcluida, location.pathname, navigate, loading]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  
  if (usuario.perfil === 'ADMIN' && location.pathname.startsWith('/operador')) {
     return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (usuario.perfil === 'CONSULTA' && location.pathname.startsWith('/operador')) {
     return <Navigate to="/admin/relatorios" replace />;
  }

  if (loadingComms || checkingPresenca) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  
  if (unreadCentralComms.length > 0) {
    return <CentralCommunicationViewer communications={unreadCentralComms} onComplete={() => setUnreadCentralComms([])} />;
  }
  if (unreadComms.length > 0) {
    return <CommunicationViewer communications={unreadComms} onComplete={() => setUnreadComms([])} />;
  }

  if (!presencaHojeConcluida) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-md md:max-w-5xl w-full mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icons/icone2.png" alt="" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="font-bold text-gray-900 truncate">PCEG</span>
            </div>

            {isDesktop && (isInstallable || isInstalled) && (
              <div className="hidden md:flex ml-4 mr-4">
                {isInstalled ? (
                  <span className="flex items-center text-xs font-medium text-emerald-600 gap-1">
                    <CheckCircle2 className="w-4 h-4" /> PCEG Instalado
                  </span>
                ) : (
                  <button
                    onClick={promptInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#C6922E] bg-[#C6922E]/10 hover:bg-[#C6922E]/20 transition-colors uppercase tracking-wider"
                  >
                    <MonitorDown className="w-4 h-4" /> Instalar no PC
                  </button>
                )}
              </div>
            )}
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-600 p-2"
            >

              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-md md:max-w-5xl w-full mx-auto p-4 flex flex-col">
          <Outlet context={{ setPresencaHojeConcluida }} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md md:max-w-5xl w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/operador/painel')}>
            <img src="/icons/icone2.png" alt="" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-bold text-gray-900 truncate">Olá, {usuario.usuario}</span>
          </div>

            {isDesktop && (isInstallable || isInstalled) && (
              <div className="hidden md:flex ml-4 mr-4">
                {isInstalled ? (
                  <span className="flex items-center text-xs font-medium text-emerald-600 gap-1">
                    <CheckCircle2 className="w-4 h-4" /> PCEG Instalado
                  </span>
                ) : (
                  <button
                    onClick={promptInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#C6922E] bg-[#C6922E]/10 hover:bg-[#C6922E]/20 transition-colors uppercase tracking-wider"
                  >
                    <MonitorDown className="w-4 h-4" /> Instalar no PC
                  </button>
                )}
              </div>
            )}
          <button
            onClick={logout}
            className="text-gray-500 hover:text-red-600 p-2"
          >

            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 max-w-md md:max-w-5xl w-full mx-auto p-4 flex flex-col pb-24">
        <Outlet context={{ setPresencaHojeConcluida }} />
      </main>

      {/* Fixed Bottom Navigation - Somente 2 botoes */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md md:max-w-5xl mx-auto flex h-16">
          <Link
            to="/operador/presenca"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/presenca' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <ClipboardCheck className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Presença</span>
          </Link>
          <div className="w-[1px] bg-gray-100 my-2"></div>
          <Link
            to="/operador/ferramentas"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/ferramentas' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Wrench className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Ferramentas</span>
          </Link>
          <div className="w-[1px] bg-gray-100 my-2"></div>
          <Link
            to="/operador/controle-materiais"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/controle-materiais' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Materiais</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
