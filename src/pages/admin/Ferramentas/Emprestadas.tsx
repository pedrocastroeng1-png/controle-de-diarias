import { useAuth } from '../../../contexts/AuthContext';
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { CornerDownLeft, AlertTriangle, Search, ChevronDown, ChevronUp, User, ImageOff, Filter, CheckSquare, Square, Frown } from 'lucide-react';
import { Obra, Funcao } from '../../../lib/types';

export default function Emprestadas() {
  const { usuario } = useAuth();
  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterObra, setFilterObra] = useState('');
  const [filterFuncao, setFilterFuncao] = useState('');

  const [expandedFuncs, setExpandedFuncs] = useState<Set<string>>(new Set());
  const [selectedEmprestimos, setSelectedEmprestimos] = useState<string[]>([]);

  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [selectedParaDevolver, setSelectedParaDevolver] = useState<any[]>([]);
  const [condicao, setCondicao] = useState('PERFEITO_ESTADO');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [showQuebradaModal, setShowQuebradaModal] = useState(false);
  const [quebradaFerramenta, setQuebradaFerramenta] = useState<any>(null);
  const [quebradaObs, setQuebradaObs] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [empData, obData, funcData] = await Promise.all([
        api.getEmprestimosAtivos(),
        api.getObras(),
        api.getFuncoes()
      ]);
      setEmprestimos(empData);
      setObras(obData);
      setFuncoes(funcData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(funcId: string) {
    setExpandedFuncs(prev => {
      const next = new Set(prev);
      if (next.has(funcId)) next.delete(funcId);
      else next.add(funcId);
      return next;
    });
  }

  function toggleSelect(empId: string) {
    setSelectedEmprestimos(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  }

  function openDevolucaoMultipla() {
    if (selectedEmprestimos.length === 0) return;
    const emps = emprestimos.filter(e => selectedEmprestimos.includes(e.id));
    setSelectedParaDevolver(emps);
    setCondicao('PERFEITO_ESTADO');
    setObservacao('');
    setShowDevolverModal(true);
  }

  function openDevolucaoUnica(emp: any) {
    setSelectedParaDevolver([emp]);
    setCondicao('PERFEITO_ESTADO');
    setObservacao('');
    setShowDevolverModal(true);
  }

  async function handleDevolver(e: React.FormEvent) {
    e.preventDefault();
    if (saving || selectedParaDevolver.length === 0) return;
    try {
      setSaving(true);
      const results = await Promise.allSettled(
        selectedParaDevolver.map(emp => 
          api.devolverFerramenta(emp.id, condicao, observacao, usuario!.id, emp.ferramenta_id)
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        alert('Algumas devoluções falharam. Verifique e tente novamente.');
      } else {
        alert('Ferramenta(s) devolvida(s) com sucesso!');
      }
      
      setShowDevolverModal(false);
      setSelectedEmprestimos([]);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao devolver ferramenta(s)');
    } finally {
      setSaving(false);
    }
  }

  function openQuebrada(emp: any) {
    setQuebradaFerramenta(emp.ferramenta);
    setQuebradaObs('');
    setShowQuebradaModal(true);
  }

  async function handleMarcarQuebrada(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !quebradaFerramenta) return;
    try {
      setSaving(true);
      await api.marcarQuebradaFerramenta(quebradaFerramenta.id, quebradaObs, usuario!.id);
      setShowQuebradaModal(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao marcar ferramenta como quebrada');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarcarPerdida(ferramentaId: string) {
    if (confirm('Tem certeza que deseja marcar esta ferramenta como perdida?')) {
      try {
        await api.marcarPerdidaFerramenta(ferramentaId, 'Marcada como perdida enquanto estava emprestada.', usuario!.id);
        loadData();
      } catch (error: any) {
        alert(error.message || 'Erro ao marcar como perdida');
      }
    }
  }

  const groupedData = useMemo(() => {
    let filtered = emprestimos;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.funcionario?.nome?.toLowerCase().includes(q) ||
        emp.ferramenta?.nome?.toLowerCase().includes(q) ||
        emp.ferramenta?.codigo_interno?.toLowerCase().includes(q)
      );
    }
    if (filterObra) {
      filtered = filtered.filter(emp => emp.obra_id === filterObra);
    }
    if (filterFuncao) {
      filtered = filtered.filter(emp => emp.funcionario?.funcao_id === filterFuncao);
    }

    const groups = new Map<string, any>();
    filtered.forEach(emp => {
      const funcId = emp.funcionario_id;
      if (!groups.has(funcId)) {
        groups.set(funcId, {
          funcionario: emp.funcionario,
          emprestimos: []
        });
      }
      groups.get(funcId).emprestimos.push(emp);
    });

    return Array.from(groups.values()).sort((a, b) => 
      (a.funcionario?.nome || '').localeCompare(b.funcionario?.nome || '')
    );
  }, [emprestimos, searchQuery, filterObra, filterFuncao]);

  const uniqueFuncionariosCount = new Set(emprestimos.map(e => e.funcionario_id)).size;
  const ferramentasCount = emprestimos.length;
  const uniqueObrasCount = new Set(emprestimos.map(e => e.obra_id)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Funcionários com Ferramentas</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{uniqueFuncionariosCount}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg"><User className="h-6 w-6" /></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Ferramentas Emprestadas</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{ferramentasCount}</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Obras Ativas</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{uniqueObrasCount}</p>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-lg"><CornerDownLeft className="h-6 w-6" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por funcionário, ferramenta, código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterObra}
              onChange={(e) => setFilterObra(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Todas as Obras</option>
              {obras.map(o => (<option key={o.id} value={o.id}>{o.nome}</option>))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterFuncao}
              onChange={(e) => setFilterFuncao(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Todas as Funções</option>
              {funcoes.map(f => (<option key={f.id} value={f.id}>{f.nome}</option>))}
            </select>
          </div>
        </div>
        
        {selectedEmprestimos.length > 0 && (
          <div className="flex-shrink-0">
            <button 
              onClick={openDevolucaoMultipla}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Devolver Selecionadas ({selectedEmprestimos.length})
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : groupedData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <p className="text-gray-500">Nenhum empréstimo encontrado.</p>
          </div>
        ) : (
          groupedData.map((group) => {
            const func = group.funcionario;
            const isExpanded = expandedFuncs.has(func?.id);
            const obraName = group.emprestimos[0]?.obra?.nome || 'Obra não informada';
            const numFerramentas = group.emprestimos.length;

            return (
              <div key={func?.id || 'unknown'} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(func?.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                      {func?.photo_path ? (
                        <img src={func.photo_path} alt={func.nome} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900">{func?.nome || 'Funcionário Desconhecido'}</h4>
                      <p className="text-sm text-gray-500">
                        {func?.funcao?.nome || 'Função não informada'} • {obraName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {numFerramentas} ferramenta{numFerramentas > 1 ? 's' : ''}
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-3">
                      {group.emprestimos.map((emp: any) => {
                        const isSelected = selectedEmprestimos.includes(emp.id);
                        return (
                          <div key={emp.id} className={`bg-white rounded-lg border ${isSelected ? 'border-blue-300 ring-1 ring-blue-300' : 'border-gray-200'} p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all`}>
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSelect(emp.id)}>
                              <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </div>
                              <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                                {emp.ferramenta?.foto_path ? (
                                  <img src={emp.ferramenta.foto_path} alt={emp.ferramenta.nome} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageOff className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {emp.ferramenta?.codigo_interno} - {emp.ferramenta?.nome} {emp.ferramenta?.status === 'QUEBRADA' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Quebrada</span>}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {emp.ferramenta?.marca} {emp.ferramenta?.modelo && `• ${emp.ferramenta.modelo}`} 
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Emprestado em: {format(new Date(emp.data_emprestimo), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 md:justify-end flex-wrap">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openDevolucaoUnica(emp); }}
                                className="text-xs inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <CornerDownLeft className="h-3.5 w-3.5 mr-1 text-blue-600" /> Devolver
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openQuebrada(emp); }}
                                className="text-xs inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                              >
                                <Frown className="h-3.5 w-3.5 mr-1" /> Quebrada
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarcarPerdida(emp.ferramenta_id); }}
                                className="text-xs inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Perdida
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showDevolverModal && selectedParaDevolver.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDevolverModal(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleDevolver}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Devolver {selectedParaDevolver.length > 1 ? `${selectedParaDevolver.length} Ferramentas` : 'Ferramenta'}
                  </h3>
                  {selectedParaDevolver.length === 1 && (
                    <div className="mb-4 text-sm text-gray-600">
                      <p><strong>Ferramenta:</strong> {selectedParaDevolver[0].ferramenta?.codigo_interno} - {selectedParaDevolver[0].ferramenta?.nome}</p>
                      <p><strong>Funcionário:</strong> {selectedParaDevolver[0].funcionario?.nome}</p>
                    </div>
                  )}
                  {selectedParaDevolver.length > 1 && (
                    <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <ul className="list-disc pl-5">
                        {selectedParaDevolver.map(emp => (
                          <li key={emp.id}>{emp.ferramenta?.codigo_interno} - {emp.ferramenta?.nome} (de {emp.funcionario?.nome})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condição de Devolução</label>
                      <select required value={condicao} onChange={e => setCondicao(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                        <option value="PERFEITO_ESTADO">Perfeito Estado</option>
                        <option value="DANIFICADA">Danificada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observação {condicao === 'DANIFICADA' && '*'}</label>
                      <textarea required={condicao === 'DANIFICADA'} value={observacao} onChange={e => setObservacao(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {saving ? 'Registrando...' : 'Confirmar Devolução'}
                  </button>
                  <button type="button" onClick={() => setShowDevolverModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quebrada */}
      {showQuebradaModal && quebradaFerramenta && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowQuebradaModal(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleMarcarQuebrada}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Marcar como Quebrada
                  </h3>
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Ferramenta:</strong> {quebradaFerramenta.codigo_interno} - {quebradaFerramenta.nome}</p>
                    <p className="mt-2 text-orange-600">A ferramenta continuará vinculada ao funcionário, mas seu status passará a ser QUEBRADA.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observação sobre o defeito *</label>
                      <textarea required value={quebradaObs} onChange={e => setQuebradaObs(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="Descreva o que quebrou..." />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {saving ? 'Registrando...' : 'Confirmar'}
                  </button>
                  <button type="button" onClick={() => setShowQuebradaModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
