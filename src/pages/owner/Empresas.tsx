import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Search, Plus, CheckCircle2, XCircle, Users, HardHat, FileCheck2, Edit, ChevronRight, Check } from 'lucide-react';

export default function OwnerEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // New Empresa State
  const [newNome, setNewNome] = useState('');
  const [newPlanoId, setNewPlanoId] = useState('');

  // Edit Empresa State
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [editNome, setEditNome] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load Planos
      const { data: pData } = await supabase.from('planos').select('*').eq('ativo', true).order('valor_mensal', { ascending: true });
      if (pData) setPlanos(pData);

      // Load Empresas with counts and active subscription
      const { data: eData, error: eErr } = await supabase.from('empresas').select(`
        *,
        assinaturas(*, planos(*)),
        usuarios(count),
        funcionarios(count),
        obras(count)
      `).order('created_at', { ascending: false });

      if (eErr) throw eErr;
      setEmpresas(eData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmpresas = empresas.filter(emp => {
    const matchSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || 
                        (statusFilter === 'ACTIVE' && emp.ativo) || 
                        (statusFilter === 'INACTIVE' && !emp.ativo);
    return matchSearch && matchStatus;
  });

  const handleOpenNew = () => {
    setNewNome('');
    setNewPlanoId(planos[0]?.id || '');
    setError('');
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      // Create empresa
      const { data: emp, error: empErr } = await supabase
        .from('empresas')
        .insert({
          nome: newNome,
          ativo: true,
          status: 'ACTIVE'
        })
        .select()
        .single();
        
      if (empErr) throw empErr;

      // Assign plano if selected
      if (newPlanoId && emp) {
        const plano = planos.find(p => p.id === newPlanoId);
        if (plano) {
          const { error: assErr } = await supabase
            .from('assinaturas')
            .insert({
              empresa_id: emp.id,
              plano_id: plano.id,
              status: 'ACTIVE',
              valor_mensal: plano.valor_mensal,
              started_at: new Date().toISOString(),
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              is_legacy: false
            });
            
          if (assErr) console.error("Erro ao criar assinatura:", assErr);
        }
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmpresa(emp);
    setEditNome(emp.nome);
    setEditAtivo(emp.ativo);
    setError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;
    
    setSaving(true);
    setError('');
    try {
      const { error: updErr } = await supabase
        .from('empresas')
        .update({
          nome: editNome,
          ativo: editAtivo,
          status: editAtivo ? 'ACTIVE' : 'SUSPENDED'
        })
        .eq('id', selectedEmpresa.id);
        
      if (updErr) throw updErr;

      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar empresa');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getActivePlan = (emp: any) => {
    const activeAssinatura = emp.assinaturas?.find((a: any) => a.status === 'ACTIVE');
    return activeAssinatura?.planos?.nome || 'Sem plano';
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500">Gerencie as empresas que utilizam a plataforma.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome da empresa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="INACTIVE">Inativas</option>
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Empresa</th>
                  <th className="p-4 whitespace-nowrap">Plano</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap text-center">Usuários</th>
                  <th className="p-4 whitespace-nowrap text-center">Funcionários</th>
                  <th className="p-4 whitespace-nowrap text-center">Obras</th>
                  <th className="p-4 whitespace-nowrap">Data de Cadastro</th>
                  <th className="p-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmpresas.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        {emp.nome}
                      </div>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">ID: {emp.id.split('-')[0]}...</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {getActivePlan(emp)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        emp.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.ativo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {emp.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        {emp.usuarios?.[0]?.count || 0}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        <HardHat className="w-4 h-4 text-amber-500" />
                        {emp.funcionarios?.[0]?.count || 0}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        <FileCheck2 className="w-4 h-4 text-blue-500" />
                        {emp.obras?.[0]?.count || 0}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(emp.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(emp)}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* NOVO MODAL: NOVA EMPRESA */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Nova Empresa</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Digite o nome..."
                  value={newNome}
                  onChange={e => setNewNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plano Inicial</label>
                <select
                  value={newPlanoId}
                  onChange={e => setNewPlanoId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sem plano definido</option>
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} - R$ {p.valor_mensal}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Ao selecionar um plano, uma assinatura será criada automaticamente.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !newNome} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Criando...' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVO MODAL: EDITAR / DETALHES */}
      {showEditModal && selectedEmpresa && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes da Empresa</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 bg-white overflow-y-auto max-h-[70vh]">
              {/* Resumo/Métricas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-500 mb-1" />
                    <div className="text-2xl font-bold text-gray-900">{selectedEmpresa.usuarios?.[0]?.count || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Usuários</div>
                 </div>
                 <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col items-center justify-center">
                    <HardHat className="w-5 h-5 text-amber-500 mb-1" />
                    <div className="text-2xl font-bold text-gray-900">{selectedEmpresa.funcionarios?.[0]?.count || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Funcionários</div>
                 </div>
                 <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                    <FileCheck2 className="w-5 h-5 text-emerald-500 mb-1" />
                    <div className="text-2xl font-bold text-gray-900">{selectedEmpresa.obras?.[0]?.count || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Obras</div>
                 </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Operacional</label>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={editAtivo === true}
                        onChange={() => setEditAtivo(true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Ativa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={editAtivo === false}
                        onChange={() => setEditAtivo(false)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Inativa</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Empresas inativas não permitem novos acessos.</p>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informações Adicionais</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Data de Criação:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedEmpresa.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plano Atual:</span>
                      <span className="font-medium text-gray-900">{getActivePlan(selectedEmpresa)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving || !editNome} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
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
