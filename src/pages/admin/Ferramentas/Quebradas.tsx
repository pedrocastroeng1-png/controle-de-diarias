import { useAuth } from '../../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { Wrench, AlertTriangle, Eye, Search, ImageOff, MoreVertical, X } from 'lucide-react';
import { Ferramenta } from '../../../lib/types';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function Quebradas() {
  const { usuario } = useAuth();
  const isMobile = useIsMobile();
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedMobileTool, setSelectedMobileTool] = useState<Ferramenta | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getFerramentas();
      setFerramentas(data.filter(f => f.status === 'QUEBRADA'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarReparo(ferramentaId: string) {
    if (confirm('Enviar esta ferramenta para reparo?')) {
      try {
        await api.marcarReparoFerramenta(ferramentaId, 'Enviada para reparo a partir de Quebradas', usuario!.id);
        loadData();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao enviar para reparo');
      }
    }
  }

  async function handleMarcarPerdida(ferramentaId: string) {
    if (confirm('Tem certeza que deseja marcar como perdida?')) {
      try {
        await api.marcarPerdidaFerramenta(ferramentaId, 'Marcada como perdida', usuario!.id);
        loadData();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao marcar perdida');
      }
    }
  }

  const filtered = ferramentas.filter(f => 
    f.nome.toLowerCase().includes(search.toLowerCase()) || 
    f.codigo_interno.toLowerCase().includes(search.toLowerCase()) ||
    (f.marca && f.marca.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar ferramentas quebradas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Carregando...</div>
      ) : isMobile ? (
        <div className="space-y-4">
          {filtered.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                   {f.foto_path ? (
                     <img src={f.foto_path} alt={f.nome} className="h-full w-full object-cover" />
                   ) : (
                     <ImageOff className="h-6 w-6 text-gray-400" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{f.nome}</h3>
                  <p className="text-sm text-gray-500 truncate">Cód: {f.codigo_interno}</p>
                  <p className="text-xs text-gray-400 mt-1">Atualizado em: {format(new Date(f.updated_at), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 p-2 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedMobileTool(f)}
                  className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm active:bg-gray-50 w-full justify-center"
                >
                  <MoreVertical className="h-4 w-4 mr-2" /> Ações
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
               <p className="text-gray-500">Nenhuma ferramenta quebrada encontrada.</p>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Modificação</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma ferramenta quebrada encontrada.</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                        {f.foto_path ? (
                          <img src={f.foto_path} alt={f.nome} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{f.codigo_interno} - {f.nome}</div>
                        <div className="text-sm text-gray-500">{f.marca} {f.modelo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(f.updated_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEnviarReparo(f.id)} className="text-orange-600 hover:text-orange-900 mr-4 inline-flex items-center" title="Enviar para Reparo">
                      <Wrench className="h-4 w-4 mr-1" /> Reparo
                    </button>
                    <button onClick={() => handleMarcarPerdida(f.id)} className="text-gray-600 hover:text-gray-900 mr-4 inline-flex items-center" title="Marcar Perdida">
                      <AlertTriangle className="h-4 w-4 mr-1" /> Perdida
                    </button>
                    <a href={`/admin/ferramentas/${f.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center" title="Visualizar">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Bottom Sheet for Actions */}
      {selectedMobileTool && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedMobileTool(null)}></div>
          <div className="relative bg-white rounded-t-2xl w-full p-4 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                   {selectedMobileTool.foto_path ? (
                     <img src={selectedMobileTool.foto_path} alt="" className="h-full w-full object-cover" />
                   ) : (
                     <ImageOff className="h-5 w-5 text-gray-400" />
                   )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMobileTool.nome}</h3>
                  <p className="text-sm text-gray-500">Cód: {selectedMobileTool.codigo_interno}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMobileTool(null)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <a href={`/admin/ferramentas/${selectedMobileTool.id}`} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Visualizar Detalhes</span>
              </a>

              <button onClick={() => handleEnviarReparo(selectedMobileTool.id)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-4">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Enviar para Reparo</span>
              </button>

              <button onClick={() => handleMarcarPerdida(selectedMobileTool.id)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-4">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Marcar como Perdida</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
