import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function HistoricoFerramentas() {
  const isMobile = useIsMobile();
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorico();
  }, []);

  async function loadHistorico() {
    try {
      setLoading(true);
      const data = await api.getHistoricoFerramentas();
      setHistorico(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Ferramentas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registro de todas as movimentações e eventos das ferramentas.
          </p>
        </div>
      </div>

      {loading ? (
         <div className="text-center py-10 text-gray-500">Carregando...</div>
      ) : isMobile ? (
        <div className="space-y-4">
          {historico.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Nenhum registro encontrado.</p>
            </div>
          ) : historico.map(h => (
            <div key={h.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center text-xs font-medium text-gray-500">
                   <Clock className="h-3.5 w-3.5 mr-1" />
                   {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                 </div>
                 <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                   {h.evento}
                 </span>
              </div>
              <div className="mb-2">
                <span className="text-sm font-semibold text-gray-900">{h.ferramenta?.codigo_interno} - {h.ferramenta?.nome}</span>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">{h.descricao}</p>
              <div className="mt-3 text-xs text-gray-400">
                Registrado por: {h.usuario?.usuario || 'Sistema'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historico.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
                ) : historico.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {h.ferramenta?.codigo_interno} - {h.ferramenta?.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {h.evento}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {h.usuario?.usuario || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {h.descricao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
