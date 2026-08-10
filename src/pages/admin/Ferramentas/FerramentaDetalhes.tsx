import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { ArrowLeft, PenTool, ImageOff, User, Wrench, AlertTriangle, CornerDownLeft, Clock } from 'lucide-react';

export default function FerramentaDetalhes() {
  const { id } = useParams();
  const { usuario } = require('../../../contexts/AuthContext').useAuth();
  const navigate = useNavigate();
  const [ferramenta, setFerramenta] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmp, setCurrentEmp] = useState<any>(null);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  async function loadData(ferId: string) {
    try {
      setLoading(true);
      const [ferData, histData, empData] = await Promise.all([
        api.getFerramentas().then(res => res.find(f => f.id === ferId)),
        api.getHistoricoFerramentas(ferId),
        api.getTodosEmprestimos().then(res => res.filter(e => e.ferramenta_id === ferId && !e.data_devolucao)[0])
      ]);
      setFerramenta(ferData);
      setHistorico(histData);
      setCurrentEmp(empData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
  if (!ferramenta) return <div className="p-8 text-center text-red-500">Ferramenta não encontrada.</div>;

  const STATUS_COLORS = {
    ATIVA: 'bg-green-100 text-green-800',
    EMPRESTADA: 'bg-blue-100 text-blue-800',
    QUEBRADA: 'bg-red-100 text-red-800',
    EM_REPARO: 'bg-orange-100 text-orange-800',
    PERDIDA: 'bg-gray-100 text-gray-800',
    INATIVA: 'bg-gray-200 text-gray-600'
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              {ferramenta.foto_path ? (
                <img src={ferramenta.foto_path} alt={ferramenta.nome} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-16 w-16 text-gray-300" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{ferramenta.nome}</h1>
                <p className="text-lg text-gray-500 mt-1">Cód: {ferramenta.codigo_interno}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[ferramenta.status as keyof typeof STATUS_COLORS]}`}>
                {ferramenta.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {ferramenta.status === 'ATIVA' && (
                <>
                  <button onClick={() => alert('Emprestar (Implemente no painel principal)')} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Emprestar
                  </button>
                  <button onClick={async () => {
                    if (confirm('Enviar para reparo?')) {
                      await api.marcarReparoFerramenta(ferramenta.id, 'Enviada pela tela de detalhes', usuario?.id); // Need real user context
                      window.location.reload();
                    }
                  }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-orange-700 bg-orange-100 hover:bg-orange-200">
                    <Wrench className="h-4 w-4 mr-1" /> Reparo
                  </button>
                </>
              )}
              {ferramenta.status === 'EMPRESTADA' && (
                <button onClick={() => alert('Devolver (Implemente no painel de emprestadas)')} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <CornerDownLeft className="h-4 w-4 mr-1" /> Devolver
                </button>
              )}
              {['ATIVA', 'EMPRESTADA'].includes(ferramenta.status) && (
                <button onClick={async () => {
                  if (confirm('Marcar como quebrada?')) {
                    await api.marcarQuebradaFerramenta(ferramenta.id, 'Marcada na tela de detalhes', usuario?.id); // Need real user context
                    window.location.reload();
                  }
                }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-red-700 bg-red-100 hover:bg-red-200">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Quebrada
                </button>
              )}
              {ferramenta.status !== 'PERDIDA' && ferramenta.status !== 'INATIVA' && (
                <button onClick={async () => {
                  if (confirm('Marcar como perdida?')) {
                    await api.marcarPerdidaFerramenta(ferramenta.id, 'Marcada na tela de detalhes', usuario?.id);
                    window.location.reload();
                  }
                }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200">
                  Perdida
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500">Marca</p>
                <p className="text-base text-gray-900">{ferramenta.marca || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Modelo</p>
                <p className="text-base text-gray-900">{ferramenta.modelo || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cadastrada em</p>
                <p className="text-base text-gray-900">{format(new Date(ferramenta.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Última Manutenção</p>
                <p className="text-base text-gray-900">{ferramenta.ultima_manutencao ? format(new Date(ferramenta.ultima_manutencao), 'dd/MM/yyyy') : '-'}</p>
              </div>
            </div>

            {ferramenta.observacoes && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Observações Gerais</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{ferramenta.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentEmp && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden mb-8">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h3 className="text-base font-semibold text-blue-900">Empréstimo Ativo</h3>
          </div>
          <div className="p-6 flex items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-300">
              {currentEmp.funcionario?.photo_path ? (
                <img src={currentEmp.funcionario.photo_path} alt={currentEmp.funcionario.nome} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Emprestado para</p>
              <p className="text-lg font-semibold text-gray-900">{currentEmp.funcionario?.nome}</p>
              <p className="text-sm text-gray-600 mt-1">
                Obra: <span className="font-medium">{currentEmp.obra?.nome || 'Não informada'}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Desde: {format(new Date(currentEmp.data_emprestimo), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-500" />
          <h3 className="text-base font-medium text-gray-900">Linha do Tempo (Histórico)</h3>
        </div>
        <div className="p-6">
          {historico.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">Nenhum registro encontrado.</p>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {historico.map((h, hIdx) => {
                  const isLast = hIdx === historico.length - 1;
                  return (
                    <li key={h.id}>
                      <div className="relative pb-8">
                        {!isLast && <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100 text-gray-500">
                              <PenTool className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">{h.descricao || h.evento}</p>
                              {h.usuario && <p className="text-xs text-gray-500 mt-1">Registrado por: {h.usuario.usuario}</p>}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={h.created_at}>{format(new Date(h.created_at), 'dd/MM HH:mm')}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
