
import { api } from '../../lib/api';
import { CommunicationViewer } from '../CommunicationViewer';
import { CentralCommunicationViewer } from '../CentralCommunicationViewer';

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheck, LogOut, Wrench, LayoutDashboard, HardHat, Briefcase, Users, FileText, Stethoscope, Megaphone, Camera, Bell, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { version } from '../../config/appVersion';
import { format } from 'date-fns';

export function AdminLayout() {
  const { usuario, logout, loading } = useAuth();
  const location = useLocation();

  const [unreadComms, setUnreadComms] = useState<any[]>([]);
  const [unreadCentralComms, setUnreadCentralComms] = useState<any[]>([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'CADASTROS',
      icon: Briefcase,
      items: [
        { name: 'Obras', path: '/admin/obras' },
        { name: 'Funções', path: '/admin/funcoes' },
        { name: 'Funcionários', path: '/admin/funcionarios' }
      ]
    },
    {
      name: 'DIÁRIAS',
      icon: ClipboardCheck,
      items: [
        { name: 'Presença', path: '/admin/presenca' },
        { name: 'Atestados', path: '/admin/atestados' },
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    },
    {
      name: 'FERRAMENTAS',
      path: '/admin/ferramentas',
      icon: Wrench
    },
    {
      name: 'CONTROLE DE MATERIAIS',
      path: '/admin/controle-materiais',
      icon: Package
    },
    {
      name: 'RESULTADOS',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'COMUNICAÇÕES',
      icon: Megaphone,
      items: [
        { name: 'Central de Comunicações', path: '/admin/central-comunicacoes' },
        { name: 'Automações', path: '/admin/automacoes' }
      ]
    }
  ];

  const consultaMenuGroups = [
    {
      name: 'RESULTADOS',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'DIÁRIAS',
      icon: ClipboardCheck,
      items: [
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-gray-200">
          <img src="/logo.png" alt="Controle de Diárias" className="h-24 w-24 object-contain mb-3" />
          <h1 className="text-lg font-bold text-gray-900 text-center leading-tight">Controle de Diárias</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuGroups.map((group) => {
            const Icon = group.icon;
            if (group.path) {
              const isActive = location.pathname.startsWith(group.path);
              return (
                <Link
                  key={group.path}
                  to={group.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                  {group.name}
                </Link>
              );
            }

            const isExpanded = expandedGroup === group.name;
            const hasActiveChild = group.items?.some(item => 
              item.path.includes('?') 
                ? location.pathname + location.search === item.path
                : location.pathname.startsWith(item.path.split('?')[0])
            );

            return (
              <div key={group.name} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    hasActiveChild && !isExpanded ? "bg-blue-50/50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn("mr-3 h-5 w-5", hasActiveChild && !isExpanded ? "text-blue-700" : "text-gray-400")} />
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
                              ? "bg-blue-50 text-blue-700 font-medium" 
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
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
            <div className="flex-1 truncate">
              {usuario.usuario}
              <div className="text-xs text-gray-500 font-normal">Administrador</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            Controle de Diárias<br/>
            Versão {version}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-3 md:hidden">
           <img src="/logo.png" alt="Controle de Diárias" className="h-10 w-10 object-contain" />
           <h1 className="text-xl font-bold text-gray-900 flex-1">Controle de Diárias</h1>
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
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-bold text-gray-900 truncate">Controle de Diárias</span>
            </div>
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
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 truncate">Olá, {usuario.usuario}</span>
          </div>
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
