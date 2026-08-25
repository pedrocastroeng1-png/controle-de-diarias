import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Wrench, CornerDownLeft, AlertTriangle, Hammer, Hand, Plus } from 'lucide-react';
import { Ferramenta, Funcionario, Obra } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

export default function FerramentasOperador() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'disponiveis' | 'emprestadas'>('disponiveis');
  
  // Data
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  
  // Modals state
  const [showEmprestarModal, setShowEmprestarModal] = useState(false);
  const [selectedFerramenta, setSelectedFerramenta] = useState<Ferramenta | null>(null);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<any>(null);
  
  // Form state
  const [funcionarioId, setFuncionarioId] = useState('');
  const [obraId, setObraId] = useState('');
  const [condicao, setCondicao] = useState('PERFEITO_ESTADO');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      if (activeTab === 'disponiveis') {
        const [ferData, funcData, obData] = await Promise.all([
          api.getFerramentas(),
          api.getFuncionarios(),
          api.getObras()
        ]);
        const filtered = ferData.filter(f => f.status === 'ATIVA');
        setFerramentas(filtered);
        setFuncionarios(funcData.filter(f => f.ativo));
        setObras(obData);
        
        const urls: Record<string, string> = {};
        for (const f of filtered) {
          if (f.foto_path) {
            try {
              urls[f.id] = await api.getPhotoUrl('fotos_ferramentas', f.foto_path);
            } catch (e) { console.warn(e); }
          }
        }
        setImageUrls(urls);
      } else {
        const data = await api.getEmprestimosAtivos();
        setEmprestimos(data);
        const urls: Record<string, string> = {};
        for (const emp of data) {
          if (emp.ferramenta?.foto_path) {
            try {
              urls[emp.ferramenta_id] = await api.getPhotoUrl('fotos_ferramentas', emp.ferramenta.foto_path);
            } catch (e) { console.warn(e); }
          }
        }
        setImageUrls(urls);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Actions
  function openEmprestar(ferramenta: Ferramenta) {
    setSelectedFerramenta(ferramenta);
    setFuncionarioId('');
    setObraId('');
    setShowEmprestarModal(true);
  }

  async function handleEmprestar(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !selectedFerramenta || !funcionarioId || !obraId) return;
    try {
      setSaving(true);
      await api.emprestarFerramenta(selectedFerramenta.id, funcionarioId, obraId, usuario!.id);
      setShowEmprestarModal(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao emprestar ferramenta');
    } finally {
      setSaving(false);
    }
  }

  function openDevolucao(emp: any) {
    setSelectedEmprestimo(emp);
    setCondicao('PERFEITO_ESTADO');
    setObservacao('');
    setShowDevolverModal(true);
  }

  async function handleDevolver(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !selectedEmprestimo) return;
    try {
      setSaving(true);
      await api.devolverFerramenta(selectedEmprestimo.id, condicao, observacao, usuario!.id, selectedEmprestimo.ferramenta_id);
      setShowDevolverModal(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao devolver ferramenta');
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

  return (
    <div className="flex flex-col animate-in fade-in duration-300 w-full pb-8">
      <div className="flex -mb-px  w-full bg-white rounded-t-xl border border-b-0 border-gray-200">
        <button
          onClick={() => setActiveTab('disponiveis')}
          className={`flex-1  py-3 px-2 border-b-2 font-medium text-xs sm:text-sm text-center transition-colors ${
            activeTab === 'disponiveis'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Disponíveis
        </button>
        <button
          onClick={() => setActiveTab('emprestadas')}
          className={`flex-1  py-3 px-2 border-b-2 font-medium text-xs sm:text-sm text-center transition-colors ${
            activeTab === 'emprestadas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Emprestadas
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="md:overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                {activeTab === 'emprestadas' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">Carregando...</td></tr>
              ) : activeTab === 'disponiveis' && ferramentas.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">Nenhuma ferramenta disponível.</td></tr>
              ) : activeTab === 'emprestadas' && emprestimos.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">Nenhuma ferramenta emprestada.</td></tr>
              ) : activeTab === 'disponiveis' ? (
                ferramentas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                           {imageUrls[f.id] ? (
                             <img className="h-10 w-10 rounded-full object-cover" src={imageUrls[f.id]} alt="" />
                           ) : (
                             <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                               <Wrench className="h-5 w-5 text-gray-500" />
                             </div>
                           )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 break-words">{f.nome}</div>
                          <div className="text-xs text-gray-500">{f.codigo_interno} | {f.marca} {f.modelo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEmprestar(f)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors">
                        <Hand className="h-4 w-4 mr-1.5" /> Emprestar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                emprestimos.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                           {emp.ferramenta?.foto_path ? (
                             <img className="h-10 w-10 rounded-full object-cover" src={imageUrls[emp.ferramenta_id] || ''} alt="" />
                           ) : (
                             <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                               <Wrench className="h-5 w-5 text-gray-500" />
                             </div>
                           )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 break-words">{emp.ferramenta?.nome}</div>
                          <div className="text-xs text-gray-500">{emp.ferramenta?.codigo_interno}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.funcionario?.nome}</div>
                      <div className="text-xs text-gray-500">{emp.obra?.nome}</div>
                      <div className="text-xs text-gray-400 mt-1">{format(new Date(emp.data_emprestimo), 'dd/MM/yyyy HH:mm')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-y-2">
                      <button onClick={() => openDevolucao(emp)} className="w-full justify-center text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors">
                        <CornerDownLeft className="h-4 w-4 mr-1.5" /> Devolver
                      </button>
                      <button onClick={() => handleMarcarPerdida(emp.ferramenta_id)} className="w-full justify-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors mt-1">
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Perdida
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden flex flex-col space-y-4 mt-4 pb-8">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Carregando...</div>
        ) : activeTab === 'disponiveis' && ferramentas.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta disponível.</div>
        ) : activeTab === 'emprestadas' && emprestimos.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta emprestada.</div>
        ) : activeTab === 'disponiveis' ? (
          ferramentas.map((f) => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                {imageUrls[f.id] ? (
                  <img className="h-8 w-8 rounded-full object-cover" src={imageUrls[f.id]} alt="" />
                ) : (
                  <span className="text-xl">🔨</span>
                )}
                <h3 className="text-lg font-bold text-gray-900 break-words">{f.nome}</h3>
              </div>
              
              <div className="text-base text-gray-700 font-medium">
                {f.marca} {f.modelo}
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Código:</div>
                <div className="font-semibold text-gray-900">{f.codigo_interno}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Status:</div>
                <div className="font-semibold text-green-600">Disponível</div>
              </div>

              <div className="pt-2">
                <button onClick={() => openEmprestar(f)} className="w-full justify-center text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  EMPRESTAR
                </button>
              </div>
            </div>
          ))
        ) : (
          emprestimos.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                {emp.ferramenta?.foto_path ? (
                  <img className="h-8 w-8 rounded-full object-cover" src={imageUrls[emp.ferramenta_id] || ''} alt="" />
                ) : (
                  <span className="text-xl">🔨</span>
                )}
                <h3 className="text-lg font-bold text-gray-900 break-words">{emp.ferramenta?.nome}</h3>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Funcionário:</div>
                <div className="font-semibold text-gray-900">{emp.funcionario?.nome}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Retirada:</div>
                <div className="font-semibold text-gray-900">{format(new Date(emp.data_emprestimo), 'dd/MM/yyyy')}</div>
              </div>

              <div className="pt-2 flex flex-col space-y-3">
                <button onClick={() => openDevolucao(emp)} className="w-full justify-center text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  DEVOLVER
                </button>
                <button onClick={() => handleMarcarPerdida(emp.ferramenta_id)} className="w-full justify-center text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  MARCAR COMO PERDIDA
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEmprestarModal && selectedFerramenta && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEmprestarModal(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleEmprestar}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Emprestar Ferramenta
                  </h3>
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Ferramenta:</strong> {selectedFerramenta.codigo_interno} - {selectedFerramenta.nome}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                      <select required value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                        <option value="">Selecione...</option>
                        {funcionarios.map(f => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Obra</label>
                      <select required value={obraId} onChange={e => setObraId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                        <option value="">Selecione...</option>
                        {obras.map(o => (
                          <option key={o.id} value={o.id}>{o.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {saving ? 'Registrando...' : 'Confirmar Empréstimo'}
                  </button>
                  <button type="button" onClick={() => setShowEmprestarModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDevolverModal && selectedEmprestimo && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDevolverModal(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleDevolver}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Devolver Ferramenta
                  </h3>
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Ferramenta:</strong> {selectedEmprestimo.ferramenta?.codigo_interno} - {selectedEmprestimo.ferramenta?.nome}</p>
                    <p><strong>Funcionário:</strong> {selectedEmprestimo.funcionario?.nome}</p>
                  </div>
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
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {saving ? 'Registrando...' : 'Confirmar Devolução'}
                  </button>
                  <button type="button" onClick={() => setShowDevolverModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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
