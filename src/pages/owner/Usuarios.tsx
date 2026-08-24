import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Search, Plus, CheckCircle2, XCircle, Building2, Shield, Calendar, Edit, User } from 'lucide-react';

export default function OwnerUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('ALL');
  const [perfilFilter, setPerfilFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Create
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [newNome, setNewNome] = useState('');
  const [newUsuario, setNewUsuario] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newPerfil, setNewPerfil] = useState('OPERADOR');
  const [newEmpresaId, setNewEmpresaId] = useState('');
  
  // Modal Edit/Details
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editAtivo, setEditAtivo] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: eData } = await supabase.from('empresas').select('id, nome').order('nome');
      if (eData) setEmpresas(eData);

      const { data: uData, error: uErr } = await supabase
        .from('usuarios')
        .select('id, nome, usuario, email, perfil, empresa_id, ativo, created_at, updated_at, empresas(nome)')
        .order('created_at', { ascending: false });

      if (uErr) throw uErr;
      setUsuarios(uData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmpresa = empresaFilter === 'ALL' || u.empresa_id === empresaFilter;
    const matchPerfil = perfilFilter === 'ALL' || u.perfil === perfilFilter;
    const matchStatus = statusFilter === 'ALL' || 
                        (statusFilter === 'ACTIVE' && u.ativo) || 
                        (statusFilter === 'INACTIVE' && !u.ativo);
    
    return matchSearch && matchEmpresa && matchPerfil && matchStatus;
  });

  const handleOpenNew = () => {
    setNewNome('');
    setNewUsuario('');
    setNewEmail('');
    setNewSenha('');
    setNewPerfil('OPERADOR');
    setNewEmpresaId(empresas[0]?.id || '');
    setError('');
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      if (!newEmpresaId) throw new Error('Selecione uma empresa.');
      if (!newSenha) throw new Error('A senha inicial é obrigatória.');

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error('Não autenticado');

      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: newNome,
          usuario: newUsuario,
          email: newEmail,
          empresa_id: newEmpresaId,
          perfil: newPerfil,
          senha: newSenha
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setEditAtivo(user.ativo);
    setError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSaving(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error('Não autenticado');

      const res = await fetch(`/api/owner/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ativo: editAtivo
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">Gerencie os acessos das empresas à plataforma.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, usuário ou e-mail..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-4">
            <select 
              value={empresaFilter}
              onChange={e => setEmpresaFilter(e.target.value)}
              className="flex-1 lg:w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todas as Empresas</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            
            <select 
              value={perfilFilter}
              onChange={e => setPerfilFilter(e.target.value)}
              className="flex-1 lg:w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todos Perfis</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OPERADOR">OPERADOR</option>
              <option value="CONSULTA">CONSULTA</option>
            </select>

            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 lg:w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todos Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Nome</th>
                  <th className="p-4 whitespace-nowrap">Usuário / E-mail</th>
                  <th className="p-4 whitespace-nowrap">Empresa</th>
                  <th className="p-4 whitespace-nowrap">Perfil</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Criado em</th>
                  <th className="p-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{u.nome || '-'}</div>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">ID: {u.id.split('-')[0]}...</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">{u.usuario}</div>
                      {u.email && <div className="text-xs text-gray-500">{u.email}</div>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {u.empresas?.nome || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        u.perfil === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.perfil === 'CONSULTA' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.perfil}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.ativo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(u)}
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

      {/* MODAL: NOVO USUÁRIO */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Novo Usuário</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                  <select
                    required
                    value={newEmpresaId}
                    onChange={e => setNewEmpresaId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Selecione a empresa</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário (Login) *</label>
                  <input
                    type="text"
                    required
                    value={newUsuario}
                    onChange={e => setNewUsuario(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso *</label>
                  <select
                    required
                    value={newPerfil}
                    onChange={e => setNewPerfil(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="CONSULTA">CONSULTA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial *</label>
                  <input
                    type="password"
                    required
                    value={newSenha}
                    onChange={e => setNewSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">A senha será criptografada de forma segura.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !newNome || !newUsuario || !newEmpresaId || !newSenha} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES / EDITAR STATUS */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Usuário</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 bg-white overflow-y-auto max-h-[70vh]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                  {selectedUser.nome ? selectedUser.nome.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedUser.nome || selectedUser.usuario}</h3>
                  <div className="text-sm text-gray-500">{selectedUser.email || selectedUser.login}</div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400"/> Empresa</span>
                  <span className="text-sm font-medium text-gray-900">{selectedUser.empresas?.nome || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400"/> Perfil</span>
                  <span className="text-sm font-medium text-gray-900">{selectedUser.perfil}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> Criado em</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(selectedUser.created_at)}</span>
                </div>
                {selectedUser.updated_at && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> Último Acesso (Update)</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(selectedUser.updated_at)}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status de Acesso</label>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={editAtivo === true}
                        onChange={() => setEditAtivo(true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Ativo (Pode acessar)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={editAtivo === false}
                        onChange={() => setEditAtivo(false)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Inativo (Bloqueado)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Desativar o usuário impede o login, mas não apaga seu histórico, funcionários ou relatórios.
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                    {saving ? 'Salvando...' : 'Salvar Status'}
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
