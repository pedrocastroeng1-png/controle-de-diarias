import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Plus, Edit, Trash2, CheckCircle2, Clock, AlertCircle, Search } from 'lucide-react';

export default function OwnerAtualizacoes() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    message: '',
    published: false
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUpdates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUpdates = updates.filter(u => 
    (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.version && u.version.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenNew = () => {
    setEditingUpdate(null);
    setFormData({ version: '', title: '', message: '', published: false });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (update: any) => {
    setEditingUpdate(update);
    setFormData({
      version: update.version || '',
      title: update.title || '',
      message: update.message || '',
      published: update.published || false
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        version: formData.version,
        title: formData.title,
        message: formData.message,
        published: formData.published,
        published_at: formData.published ? new Date().toISOString() : null
      };

      if (editingUpdate) {
        const { error: updateErr } = await supabase
          .from('platform_updates')
          .update(payload)
          .eq('id', editingUpdate.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('platform_updates')
          .insert(payload);
        if (insertErr) throw insertErr;
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar atualização.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atualizações</h1>
          <p className="text-sm text-gray-500">Gerencie versões e comunicações de atualização da plataforma.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Atualização
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <strong>Aviso:</strong> A tabela <code className="bg-yellow-100 px-1 rounded">platform_updates</code> atual não possui as colunas <code>type</code> e <code>mandatory</code>. Apenas Versão, Título, Mensagem e Status (Publicado) estão sendo salvos.
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por versão ou título..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <RefreshCw className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Nenhuma atualização registrada</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Versão</th>
                  <th className="p-4 whitespace-nowrap">Título</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Data de Publicação</th>
                  <th className="p-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUpdates.map((upd) => (
                  <tr key={upd.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-indigo-50 text-indigo-700 font-mono">
                        v{upd.version}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{upd.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{upd.message}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        upd.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {upd.published ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {upd.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(upd.published_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(upd)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUpdate ? 'Editar Atualização' : 'Nova Atualização'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
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
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versão</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 1.2.0"
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.published ? 'published' : 'draft'}
                    onChange={e => setFormData({ ...formData, published: e.target.value === 'published' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Título da atualização"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem / Conteúdo</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva as novidades ou correções desta versão..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Atualização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
