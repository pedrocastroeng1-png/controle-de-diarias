import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Truck, Plus, Search, Loader2, Edit, Eye, Power, PowerOff, Building2, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function FornecedoresTab() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    telefone: '',
    celular: '',
    whatsapp: '',
    email: '',
    site: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFornecedores();
      setFornecedores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedFornecedor(null);
    setFormData({
      nome: '', cnpj: '', razao_social: '', nome_fantasia: '', telefone: '', celular: '', whatsapp: '', email: '',
      site: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', observacoes: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (f: any) => {
    setModalMode('edit');
    setSelectedFornecedor(f);
    setFormData({
      nome: f.nome || '',
      cnpj: f.cnpj || '',
      razao_social: f.razao_social || '',
      nome_fantasia: f.nome_fantasia || '',
      telefone: f.telefone || '',
      celular: f.celular || '',
      whatsapp: f.whatsapp || '',
      email: f.email || '',
      site: f.site || '',
      cep: f.cep || '',
      logradouro: f.logradouro || '',
      numero: f.numero || '',
      complemento: f.complemento || '',
      bairro: f.bairro || '',
      cidade: f.cidade || '',
      estado: f.estado || '',
      observacoes: f.observacoes || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenView = (f: any) => {
    setModalMode('view');
    setSelectedFornecedor(f);
    setFormData({
      nome: f.nome || '',
      cnpj: f.cnpj || '',
      razao_social: f.razao_social || '',
      nome_fantasia: f.nome_fantasia || '',
      telefone: f.telefone || '',
      celular: f.celular || '',
      whatsapp: f.whatsapp || '',
      email: f.email || '',
      site: f.site || '',
      cep: f.cep || '',
      logradouro: f.logradouro || '',
      numero: f.numero || '',
      complemento: f.complemento || '',
      bairro: f.bairro || '',
      cidade: f.cidade || '',
      estado: f.estado || '',
      observacoes: f.observacoes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setError('Nome do fornecedor é obrigatório');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        nome: formData.nome.trim(),
        cnpj: formData.cnpj.trim() || null,
        razao_social: formData.razao_social.trim() || null,
        nome_fantasia: formData.nome_fantasia.trim() || null,
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
      };

      if (modalMode === 'create') {
        await api.createFornecedor(payload);
      } else if (modalMode === 'edit') {
        await api.updateFornecedor(selectedFornecedor.id, payload);
      }
      
      await loadData();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Deseja realmente ${currentStatus ? 'inativar' : 'ativar'} este fornecedor?`)) return;
    
    try {
      await api.toggleFornecedorStatus(id, !currentStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const filteredFornecedores = fornecedores.filter(f => {
    if (statusFilter === 'ativos' && !f.ativo) return false;
    if (statusFilter === 'inativos' && f.ativo) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        f.nome?.toLowerCase().includes(term) ||
        f.nome_fantasia?.toLowerCase().includes(term) ||
        f.razao_social?.toLowerCase().includes(term) ||
        f.cnpj?.includes(term)
      );
    }
    return true;
  });

  const stats = {
    total: fornecedores.length,
    ativos: fornecedores.filter(f => f.ativo).length,
    inativos: fornecedores.filter(f => !f.ativo).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="w-5 h-5 text-blue-700" /></div>
            <span className="text-sm font-bold tracking-wider">TOTAL</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><Power className="w-5 h-5 text-green-700" /></div>
            <span className="text-sm font-bold tracking-wider">ATIVOS</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.ativos}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg"><PowerOff className="w-5 h-5 text-gray-700" /></div>
            <span className="text-sm font-bold tracking-wider">INATIVOS</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.inativos}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50">
          <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar fornecedor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Novo Fornecedor
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-500">Carregando fornecedores...</p>
          </div>
        ) : filteredFornecedores.length === 0 ? (
          <div className="p-12 text-center bg-gray-50/50">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente ajustar sua pesquisa.' : 'Comece cadastrando seu primeiro fornecedor.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFornecedores.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold">
                          {f.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{f.nome}</div>
                          {f.nome_fantasia && f.nome_fantasia !== f.nome && (
                            <div className="text-sm text-gray-500">{f.nome_fantasia}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {f.cnpj || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.telefone || f.celular || f.whatsapp ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {f.telefone || f.celular || f.whatsapp}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.cidade ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {f.cidade}{f.estado ? `/${f.estado}` : ''}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        f.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenView(f)} className="text-gray-400 hover:text-blue-600 p-1" title="Visualizar">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleOpenEdit(f)} className="text-gray-400 hover:text-blue-600 p-1" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(f.id, f.ativo)} 
                          className={`p-1 ${f.ativo ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                          title={f.ativo ? 'Inativar' : 'Ativar'}
                        >
                          {f.ativo ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="relative inline-block w-full max-w-4xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-blue-600" />
                  {modalMode === 'create' ? 'Novo Fornecedor' : modalMode === 'edit' ? 'Editar Fornecedor' : 'Visualizar Fornecedor'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  <span className="sr-only">Fechar</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">1. Dados Principais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fornecedor *</label>
                      <input
                        type="text"
                        required
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.razao_social}
                        onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">2. Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">3. Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.logradouro}
                        onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.bairro}
                        onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        disabled={modalMode === 'view'}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 uppercase"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    rows={2}
                    disabled={modalMode === 'view'}
                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                      Salvar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
