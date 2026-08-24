import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Building2, Layers, AlertCircle, CheckCircle2, Clock, X, Users, HardHat } from 'lucide-react';

export default function OwnerAssinaturas() {
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedAssinatura, setSelectedAssinatura] = useState<any>(null);
  
  // Alterar Plano Modal
  const [showAlterarModal, setShowAlterarModal] = useState(false);
  const [selectedNewPlano, setSelectedNewPlano] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [assRes, planRes, usersRes, funcsRes] = await Promise.all([
        supabase.from('assinaturas').select('*, empresas(*), planos(*)').order('created_at', { ascending: false }),
        supabase.from('planos').select('*').order('valor_mensal'),
        supabase.from('usuarios').select('empresa_id'),
        supabase.from('funcionarios').select('empresa_id')
      ]);

      if (planRes.data) setPlanos(planRes.data);

      if (assRes.data) {
        const enriched = assRes.data.map(ass => {
          const empId = ass.empresa_id;
          return {
            ...ass,
            usersCount: usersRes.data?.filter(u => u.empresa_id === empId).length || 0,
            funcsCount: funcsRes.data?.filter(f => f.empresa_id === empId).length || 0,
          };
        });
        setAssinaturas(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetails = (ass: any) => {
    setSelectedAssinatura(ass);
  };
  
  const handleOpenAlterarPlano = () => {
    if (selectedAssinatura && selectedAssinatura.plano_id) {
      setSelectedNewPlano(selectedAssinatura.plano_id);
    } else {
      setSelectedNewPlano('');
    }
    setShowAlterarModal(true);
  };

  const handleConfirmarAlteracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewPlano) return;
    
    setSaving(true);
    setError('');

    try {
      const planoSelecionado = planos.find(p => p.id === selectedNewPlano);
      if (!planoSelecionado) throw new Error('Plano não encontrado');

      const { error: updateErr } = await supabase
        .from('assinaturas')
        .update({ 
          plano_id: planoSelecionado.id,
          valor_mensal: planoSelecionado.valor_mensal
        })
        .eq('id', selectedAssinatura.id);

      if (updateErr) throw updateErr;

      setShowAlterarModal(false);
      
      // Update local state to avoid reload
      const updatedAssinatura = {
        ...selectedAssinatura,
        plano_id: planoSelecionado.id,
        valor_mensal: planoSelecionado.valor_mensal,
        planos: planoSelecionado
      };
      
      setSelectedAssinatura(updatedAssinatura);
      setAssinaturas(assinaturas.map(a => a.id === updatedAssinatura.id ? updatedAssinatura : a));

    } catch (err: any) {
      setError(err.message || 'Erro ao alterar o plano.');
    } finally {
      setSaving(false);
    }
  };

  const filteredAssinaturas = assinaturas.filter(a => 
    a.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.planos?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-sm text-gray-500">Gerencie os planos e assinaturas das empresas da plataforma.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por empresa ou plano..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredAssinaturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Nenhuma assinatura encontrada</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Empresa</th>
                  <th className="p-4 whitespace-nowrap">Plano</th>
                  <th className="p-4 whitespace-nowrap">Valor Mensal</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Início</th>
                  <th className="p-4 whitespace-nowrap">Período Atual</th>
                  <th className="p-4 whitespace-nowrap">Vencimento</th>
                  <th className="p-4 whitespace-nowrap text-center">Operadores</th>
                  <th className="p-4 whitespace-nowrap text-center">Funcionários</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssinaturas.map((ass) => (
                  <tr 
                    key={ass.id} 
                    onClick={() => handleOpenDetails(ass)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {ass.empresas?.nome || 'Empresa desconhecida'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {ass.planos?.nome || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ass.valor_mensal || 0)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${ass.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {ass.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {ass.status === 'ACTIVE' ? 'Ativo' : ass.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {ass.started_at ? new Date(ass.started_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {ass.current_period_start ? new Date(ass.current_period_start).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {ass.current_period_end ? new Date(ass.current_period_end).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-sm">
                        <span className={ass.usersCount >= (ass.planos?.max_operadores || 0) ? 'text-rose-600 font-bold' : 'text-gray-900'}>{ass.usersCount}</span>
                        <span className="text-gray-400"> / {ass.planos?.max_operadores || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-sm">
                        <span className={ass.funcsCount >= (ass.planos?.max_funcionarios || 0) ? 'text-rose-600 font-bold' : 'text-gray-900'}>{ass.funcsCount}</span>
                        <span className="text-gray-400"> / {ass.planos?.max_funcionarios || '-'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalhes */}
      {selectedAssinatura && !showAlterarModal && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Detalhes da Assinatura</h2>
                  <p className="text-xs font-mono text-gray-500">ID: {selectedAssinatura.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAssinatura(null)} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="space-y-6">
                
                {/* Identificação */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identificação</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><Building2 className="w-4 h-4" /> Empresa</span>
                      <span className="font-medium text-gray-900">{selectedAssinatura.empresas?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><Layers className="w-4 h-4" /> Plano Atual</span>
                      <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedAssinatura.planos?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Valor Mensal</span>
                      <span className="font-medium text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAssinatura.valor_mensal || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${selectedAssinatura.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedAssinatura.status === 'ACTIVE' ? 'Ativo' : selectedAssinatura.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Período */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Período de Faturamento</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Início</span>
                      <span className="font-medium text-gray-900">{selectedAssinatura.current_period_start ? new Date(selectedAssinatura.current_period_start).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Vencimento (Fim)</span>
                      <span className="font-medium text-gray-900">{selectedAssinatura.current_period_end ? new Date(selectedAssinatura.current_period_end).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Uso */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Limites e Uso</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                      <Users className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                      <div className="text-xl font-bold text-gray-900">
                        {selectedAssinatura.usersCount} <span className="text-sm font-normal text-gray-400">/ {selectedAssinatura.planos?.max_operadores}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Operadores</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                      <HardHat className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                      <div className="text-xl font-bold text-gray-900">
                        {selectedAssinatura.funcsCount} <span className="text-sm font-normal text-gray-400">/ {selectedAssinatura.planos?.max_funcionarios}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Funcionários</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between shrink-0">
              <button
                onClick={handleOpenAlterarPlano}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Alterar Plano
              </button>
              <button
                onClick={() => setSelectedAssinatura(null)}
                className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Plano */}
      {showAlterarModal && selectedAssinatura && (
        <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Alterar Plano</h2>
              <button onClick={() => setShowAlterarModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmarAlteracao} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Alterando plano da empresa <span className="font-semibold text-gray-900">{selectedAssinatura.empresas?.nome}</span>.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Selecione o novo plano</label>
                <div className="space-y-3">
                  {planos.map(p => (
                    <label 
                      key={p.id} 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedNewPlano === p.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="plano" 
                        value={p.id} 
                        checked={selectedNewPlano === p.id}
                        onChange={() => setSelectedNewPlano(p.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3 flex-1">
                        <span className="block text-sm font-medium text-gray-900">{p.nome}</span>
                        <span className="block text-xs text-gray-500">
                          Até {p.max_operadores} operadores e {p.max_funcionarios} funcionários
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_mensal)}/mês
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAlterarModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedNewPlano || selectedNewPlano === selectedAssinatura.plano_id}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Confirmar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
