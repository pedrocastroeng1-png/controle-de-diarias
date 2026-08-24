import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertCircle, Edit, Shield, Users, HardHat, DollarSign } from 'lucide-react';

export default function OwnerPlanos() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [assinaturasCount, setAssinaturasCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    valor_mensal: 0,
    max_operadores: 0,
    max_funcionarios: 0,
    ativo: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [planRes, assRes] = await Promise.all([
        supabase.from('planos').select('*').order('valor_mensal'),
        supabase.from('assinaturas').select('plano_id, status')
      ]);

      if (planRes.data) {
        setPlanos(planRes.data);
      }

      if (assRes.data) {
        const counts: Record<string, number> = {};
        assRes.data.forEach(ass => {
          counts[ass.plano_id] = (counts[ass.plano_id] || 0) + 1;
        });
        setAssinaturasCount(counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (plano: any) => {
    setEditingPlano(plano);
    setFormData({
      nome: plano.nome,
      codigo: plano.codigo,
      valor_mensal: plano.valor_mensal,
      max_operadores: plano.max_operadores,
      max_funcionarios: plano.max_funcionarios,
      ativo: plano.ativo
    });
    setShowEditModal(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlano) return;
    
    setSaving(true);
    setError('');

    try {
      const { error: updateErr } = await supabase
        .from('planos')
        .update({
          nome: formData.nome,
          codigo: formData.codigo.toUpperCase(),
          valor_mensal: formData.valor_mensal,
          max_operadores: formData.max_operadores,
          max_funcionarios: formData.max_funcionarios,
          ativo: formData.ativo
        })
        .eq('id', editingPlano.id);

      if (updateErr) throw updateErr;

      setShowEditModal(false);
      setEditingPlano(null);
      await loadData(); // Reload to get fresh data
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
          <p className="text-sm text-gray-500">Configure os planos disponíveis para as empresas da plataforma.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map(plano => (
              <div 
                key={plano.id} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${
                  plano.ativo ? 'border-gray-200' : 'border-gray-200 opacity-75 grayscale-[0.2]'
                }`}
              >
                <div className={`p-5 border-b ${plano.ativo ? 'bg-indigo-50/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-100/50 px-2 py-1 rounded">
                      {plano.codigo}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      plano.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {plano.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plano.nome}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valor_mensal)}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">/mês</span>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Até <strong className="text-gray-900">{plano.max_operadores}</strong> operadores</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <HardHat className="w-5 h-5 text-orange-400" />
                    <span>Até <strong className="text-gray-900">{plano.max_funcionarios}</strong> funcionários</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span><strong className="text-gray-900">{assinaturasCount[plano.id] || 0}</strong> empresas ativas</span>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                  <button
                    onClick={() => handleEditClick(plano)}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Plano
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPlano && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Editar Plano</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={saving}
              >
                <AlertCircle className="w-5 h-5 hidden" />
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.valor_mensal}
                    onChange={e => setFormData({ ...formData, valor_mensal: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Operadores</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_operadores}
                    onChange={e => setFormData({ ...formData, max_operadores: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Funcionários</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_funcionarios}
                    onChange={e => setFormData({ ...formData, max_funcionarios: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.ativo}
                      onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Plano Ativo</span>
                </label>
                {!formData.ativo && (assinaturasCount[editingPlano.id] > 0) && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">
                    Aviso: Existem assinaturas usando este plano. Desativar impedirá novas assinaturas, mas não cancelará as atuais.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
