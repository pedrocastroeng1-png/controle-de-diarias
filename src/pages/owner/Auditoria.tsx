import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Calendar, User, Activity, Box, Building2, FileText, X, Clock, Database, ChevronRight } from 'lucide-react';

export default function OwnerAuditoria() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState('');
  const [filterAcao, setFilterAcao] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*, empresas(nome)')
        .order('created_at', { ascending: false })
        .limit(1000);
        
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setLoading(false);
    }
  }

  // Obter opções únicas para filtros
  const modulos = Array.from(new Set(logs.map(l => l.entity_type).filter(Boolean)));
  const acoes = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  const filteredLogs = logs.filter(log => {
    const matchSearch = searchTerm === '' || 
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.empresas?.nome && log.empresas.nome.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchModulo = filterModulo === '' || log.entity_type === filterModulo;
    const matchAcao = filterAcao === '' || log.action === filterAcao;
    
    return matchSearch && matchModulo && matchAcao;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  
  const renderDetailsInfo = (details: any) => {
    if (!details) return <span className="text-gray-400 italic">Sem detalhes adicionais</span>;
    if (typeof details === 'string') return <span>{details}</span>;
    return (
      <pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto border border-gray-100">
        {JSON.stringify(details, null, 2)}
      </pre>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-sm text-gray-500">Histórico de ações administrativas da plataforma.</p>
        </div>
        <button 
          onClick={loadLogs}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
          Atualizar
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, registro ou empresa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={filterModulo}
              onChange={e => setFilterModulo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px]"
            >
              <option value="">Todos os Módulos</option>
              {modulos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={filterAcao}
              onChange={e => setFilterAcao(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px]"
            >
              <option value="">Todas as Ações</option>
              {acoes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <Database className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Nenhum registro de auditoria encontrado</p>
              <p className="text-sm mt-1">Os logs aparecerão aqui quando ações administrativas ocorrerem.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Data / Hora</th>
                  <th className="p-4 whitespace-nowrap">Ação</th>
                  <th className="p-4 whitespace-nowrap">Módulo</th>
                  <th className="p-4 whitespace-nowrap">Empresa</th>
                  <th className="p-4 whitespace-nowrap">Usuário (Owner ID)</th>
                  <th className="p-4 whitespace-nowrap text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                        <Box className="w-4 h-4 text-indigo-400" />
                        {log.entity_type || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        {log.empresas?.nome ? (
                          <>
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            {log.empresas.nome}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-mono text-xs">
                        <User className="w-4 h-4 text-gray-400" />
                        {log.owner_id ? log.owner_id.split('-')[0] + '...' : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Detalhes da Ação</h2>
                  <p className="text-xs font-mono text-gray-500">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ação Executada</span>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-100 uppercase">
                    {selectedLog.action}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data e Hora</span>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {formatDate(selectedLog.created_at)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Módulo (Entidade)</span>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <Box className="w-4 h-4 text-indigo-400" />
                    {selectedLog.entity_type || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuário (Owner ID)</span>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-xs">
                    <User className="w-4 h-4 text-gray-500" />
                    {selectedLog.owner_id || '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa Afetada</span>
                <div className="text-sm font-medium text-gray-900 flex flex-col justify-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedLog.empresas?.nome ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      <span>{selectedLog.empresas.nome}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                  {selectedLog.empresa_id && (
                    <span className="text-xs font-mono text-gray-500 mt-1 pl-6">ID: {selectedLog.empresa_id}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registro Afetado (ID)</span>
                <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-xs">
                  {selectedLog.entity_id || '-'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dados / Detalhes (JSON)
                </span>
                {renderDetailsInfo(selectedLog.details)}
              </div>
              
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
