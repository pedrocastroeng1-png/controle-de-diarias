import { useAuth } from '../../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Ferramenta } from '../../../lib/types';
import { CheckCircle, ImageOff, MoreVertical, X, Eye } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function EmReparo() {
  const { usuario } = useAuth();
  const isMobile = useIsMobile();
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMobileTool, setSelectedMobileTool] = useState<Ferramenta | null>(null);

  useEffect(() => {
    loadFerramentas();
  }, []);

  async function loadFerramentas() {
    try {
      setLoading(true);
      const data = await api.getFerramentas();
      setFerramentas(data.filter(f => f.status === 'EM_REPARO'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConcluirReparo(ferramentaId: string) {
    if (confirm('Marcar reparo como concluído e retornar ferramenta para ATIVA?')) {
      try {
        await api.reativarFerramenta(ferramentaId, 'Retornou do reparo.', usuario!.id);
        loadFerramentas();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao reativar');
      }
    }
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Carregando...</div>
      ) : isMobile ? (
        <div className="space-y-4">
          {ferramentas.map(f => (
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
                  <p className="text-xs text-gray-500 mt-1 truncate">{f.observacoes}</p>
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
          {ferramentas.length === 0 && (
             <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
               <p className="text-gray-500">Nenhuma ferramenta em reparo.</p>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ferramentas.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma ferramenta em reparo.</td></tr>
              ) : ferramentas.map((f) => (
                <tr key={f.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{f.codigo_interno}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{f.observacoes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleConcluirReparo(f.id)} className="text-green-600 hover:text-green-900 inline-flex items-center" title="Concluir Reparo">
                      <CheckCircle className="h-4 w-4 mr-1" /> Concluído
                    </button>
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

              <button onClick={() => handleConcluirReparo(selectedMobileTool.id)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Concluir Reparo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
