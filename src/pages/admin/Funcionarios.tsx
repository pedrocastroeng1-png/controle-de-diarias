import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CheckSquare, Square, Search, Edit2, Ban, RefreshCcw, 
  X, Image as ImageIcon, Plus, Users, Upload, User, DollarSign,
  AlertCircle
} from 'lucide-react';
import { CenteredDialog } from '../../components/ui/CenteredDialog';
import { allVisibleSelected, toggleVisibleSelection } from '../../lib/employee-selection';
import { saveEmployee } from '../../lib/save-employee';
import { api } from '../../lib/api';
import type { Funcionario, Funcao, Obra } from '../../lib/types';
import RelatorioFuncionarios from '../../components/funcionarios/RelatorioFuncionarios';
import { EmployeeAvatar } from '../../components/funcionarios/EmployeeAvatar';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [formError, setFormError] = useState('');
  const [editEmployee, setEditEmployee] = useState<Funcionario | null>(null);
  const savingRef = useRef(false);
  const massSavingRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ativos' | 'inativos' | 'todos'>('todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [funcaoId, setFuncaoId] = useState('');
  const [obraId, setObraId] = useState('');
  const [tipoColaborador, setTipoColaborador] = useState<'DIARISTA' | 'CLT'>('DIARISTA');
  const [formaPagamento, setFormaPagamento] = useState<"CAIXA ECONOMICA FEDERAL" | "PIX" | ''>('');
  const [agencia, setAgencia] = useState('');
  const [tipoConta, setTipoConta] = useState<"CONTA CORRENTE" | "CONTA POUPANÇA" | ''>('');
  const [conta, setConta] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [removeFoto, setRemoveFoto] = useState(false);
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Mass Edit State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMassEdit, setShowMassEdit] = useState(false);
  const [massEditObraId, setMassEditObraId] = useState('');
  const [massEditSaving, setMassEditSaving] = useState(false);
  
  const loadSequence = useRef(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    const sequence = ++loadSequence.current;
    if (!silent) setLoading(true);
    setErro('');
    try {
      const [funcs, funcsData, obsData] = await Promise.all([
        api.getFuncionarios(filter),
        api.getFuncoes(),
        api.getObras()
      ]);
      if (sequence !== loadSequence.current) return;
      setFuncionarios(funcs);
      setFuncoes(funcsData);
      setObras(obsData);
      setUpdatedAt(new Date());
      setSelectedIds(ids => ids.filter(id => funcs.some(func => func.id === id)));
    } catch (error) {
      if (sequence === loadSequence.current) setErro('Não foi possível atualizar os dados. A lista pode estar desatualizada.');
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadData();
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadData(true);
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      loadSequence.current++;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadData]);

  // Clean up preview URL on unmount or when photo changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const markDirty = () => setIsDirty(true);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      if (!file.type.startsWith('image/')) { setFormError('Selecione um arquivo de imagem.'); return; }
      setFormError('');
      markDirty();
      setFoto(file);
      setRemoveFoto(false);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    markDirty();
    setFoto(null);
    setRemoveFoto(true);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setEditEmployee(null);
    setFormError('');
    setNome('');
    setFuncaoId('');
    setObraId('');
    setTipoColaborador('DIARISTA');
    setFormaPagamento('');
    setAgencia('');
    setTipoConta('');
    setConta('');
    setChavePix('');
    setObservacaoPagamento('');
    setFoto(null);
    setRemoveFoto(false);
    setCurrentPhotoPath(null);
    setIsDirty(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (savingRef.current) return;
    if (isDirty) {
      if (!window.confirm("Você tem alterações não salvas. Deseja realmente cancelar?")) {
        return;
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !funcaoId || !obraId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setFormError('');
    let createdDuringSave = false;
    try {
      const payload: Omit<Funcionario, 'id' | 'funcao' | 'obra'> = {
        nome: nome.trim(),
        funcao_id: funcaoId, 
        obra_id: obraId,
        tipo_colaborador: tipoColaborador,
        forma_pagamento: (formaPagamento as any) || null,
        observacao_pagamento: observacaoPagamento.trim() || null
      };

      if (formaPagamento === 'CAIXA ECONOMICA FEDERAL') {
        payload.agencia = agencia || null;
        payload.tipo_conta = (tipoConta as any) || null;
        payload.conta = conta || null;
        payload.chave_pix = null;
      } else if (formaPagamento === 'PIX') {
        payload.chave_pix = chavePix || null;
        payload.agencia = null;
        payload.tipo_conta = null;
        payload.conta = null;
      } else {
        payload.agencia = null;
        payload.tipo_conta = null;
        payload.conta = null;
        payload.chave_pix = null;
      }

      await saveEmployee(api, editId, payload, foto, removeFoto, created => {
        createdDuringSave = true;
        setEditId(created.id);
        setEditEmployee(created);
      });

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Upload error details:", error);
      const msg = error.message ? error.message : JSON.stringify(error);
      const status = error.statusCode ? `(Status: ${error.statusCode})` : '';
      const errObj = error.error ? `[${error.error}]` : '';
      setFormError(`${createdDuringSave ? 'Cadastro criado, mas a foto não foi salva. Tente salvar novamente nesta ficha para concluir.' : 'Não foi possível salvar as alterações.'} ${msg} ${status} ${errObj}`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleEdit(funcionario: Funcionario) {
    resetForm();
    setEditId(funcionario.id);
    setEditEmployee(funcionario);
    setNome(funcionario.nome);
    setFuncaoId(funcionario.funcao_id);
    setObraId(funcionario.obra_id);
    setTipoColaborador(funcionario.tipo_colaborador || 'DIARISTA');
    setFormaPagamento(funcionario.forma_pagamento || '');
    setAgencia(funcionario.agencia || '');
    setTipoConta(funcionario.tipo_conta || '');
    setConta(funcionario.conta || '');
    setChavePix(funcionario.chave_pix || '');
    setObservacaoPagamento(funcionario.observacao_pagamento || '');
    setCurrentPhotoPath(funcionario.photo_path || null);
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('Deseja realmente desativar este funcionário?')) {
      setLoading(true);
      setErro('');
      try {
        await api.deleteFuncionario(id);
        await loadData();
      } catch (error) {
        setErro('Ocorreu um erro ao desativar.');
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleReactivate(id: string) {
    setLoading(true);
    setErro('');
    try {
      await api.updateFuncionario(id, { ativo: true });
      await loadData();
    } catch (error) {
      setErro('Ocorreu um erro ao reativar.');
    } finally {
      setLoading(false);
    }
  }

  const filteredFuncionarios = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleIds = filteredFuncionarios.map(f => f.id);
  const allSelected = allVisibleSelected(selectedIds, visibleIds);
  const handleSelectAll = () => setSelectedIds(ids => toggleVisibleSelection(ids, visibleIds, !allVisibleSelected(ids, visibleIds)));
  const handleSelect = (id: string) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const closeMassEdit = () => { if (!massSavingRef.current) setShowMassEdit(false); };

  const handleMassEdit = async () => {
    if (massSavingRef.current || !selectedIds.length) return;
    if (!massEditObraId) {
      alert("Selecione uma obra para alterar.");
      return;
    }
    const confirm = window.confirm(`Você está prestes a alterar a obra de ${selectedIds.length} funcionários. Deseja continuar?`);
    if (!confirm) return;
    massSavingRef.current = true;
    setMassEditSaving(true);
    setErro('');
    try {
      await api.updateFuncionariosObra(selectedIds, massEditObraId);
      
      const updated = [...funcionarios];
      selectedIds.forEach(id => {
        const index = updated.findIndex(f => f.id === id);
        if (index > -1) {
          updated[index] = { ...updated[index], obra_id: massEditObraId, obra: obras.find(o => o.id === massEditObraId) };
        }
      });
      setFuncionarios(updated);
      
      alert(`Obra atualizada para ${selectedIds.length} funcionários.`);
      setSelectedIds([]);
      setShowMassEdit(false);
      setMassEditObraId('');
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar funcionários.");
    } finally {
      massSavingRef.current = false;
      setMassEditSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-700" />
            Funcionários
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o cadastro, informações e obras dos colaboradores.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar funcionário
        </button>
      </div>

      {erro && !isModalOpen && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          {(['todos', 'ativos', 'inativos'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === opt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            aria-label="Buscar funcionário por nome"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <button type="button" onClick={handleSelectAll} disabled={loading || !visibleIds.length} aria-pressed={allSelected} className="md:hidden text-blue-700 disabled:opacity-50">{allSelected ? 'Desmarcar busca' : 'Selecionar todos na busca'}</button>
        <span aria-live="polite">{loading ? 'Atualizando…' : `${filteredFuncionarios.length} de ${funcionarios.length} funcionários no filtro ${filter}`}{updatedAt && ` · Atualizado às ${updatedAt.toLocaleTimeString('pt-BR')}`}</span>
        <button type="button" onClick={() => void loadData()} disabled={loading} className="text-blue-700 disabled:opacity-50">Atualizar lista</button>
      </div>

      {/* Mass Edit Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-blue-900">funcionários selecionados</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowMassEdit(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              Alterar Obra em Massa
            </button>
          </div>
        </div>
      )}

      {showMassEdit && (
        <CenteredDialog labelId="mass-edit-title" onClose={closeMassEdit}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 id="mass-edit-title" className="text-lg font-bold text-gray-900">Alteração em Massa</h3>
              <button aria-label="Fechar alteração em massa" disabled={massEditSaving} onClick={closeMassEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Você está prestes a alterar a obra de <strong>{selectedIds.length}</strong> funcionários. Selecione a nova obra:
              </p>
              <div className="mb-4">
                <label htmlFor="massObra" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Obra
                </label>
                <select
                  id="massObra"
                  disabled={massEditSaving}
                  value={massEditObraId}
                  onChange={(e) => setMassEditObraId(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>Selecione a nova obra</option>
                  {obras.filter(o => !o.parent_obra_id).map(o => (
                    <optgroup key={o.id} label={o.nome}>
                      <option value={o.id}>{o.nome} (Principal)</option>
                      {obras.filter(sub => sub.parent_obra_id === o.id).map(sub => (
                        <option key={sub.id} value={sub.id}>- {sub.nome}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                disabled={massEditSaving} onClick={closeMassEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleMassEdit}
                disabled={!massEditObraId || massEditSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                {massEditSaving ? 'Aplicando...' : 'Aplicar alteração'}
              </button>
            </div>
          </div>
        </CenteredDialog>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow-sm rounded-xl border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th scope="col" className="px-6 py-4 w-10 text-center">
                <button aria-label="Selecionar todos na busca" aria-pressed={allSelected} disabled={loading || !visibleIds.length} onClick={handleSelectAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                  {allSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Funcionário
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Atuação
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Carregando dados...</td></tr>
          ) : (
            filteredFuncionarios.length === 0 ? (
              <tr> 
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : filteredFuncionarios.map((funcionario) => (
              <tr key={funcionario.id} className={`hover:bg-gray-50/80 transition-colors ${funcionario.ativo === false ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button aria-label={`Selecionar ${funcionario.nome}`} aria-pressed={selectedIds.includes(funcionario.id)} onClick={() => handleSelect(funcionario.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    {selectedIds.includes(funcionario.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <EmployeeAvatar nome={funcionario.nome} photoPath={funcionario.photo_path} className="w-10 h-10" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{funcionario.nome}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">{funcionario.tipo_colaborador || 'DIARISTA'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{funcionario.funcao?.nome || '-'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{funcionario.obra?.nome || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {funcionario.ativo !== false ? (
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-green-100 text-green-800">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-gray-200 text-gray-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => handleEdit(funcionario)} 
                      className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" 
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {funcionario.ativo !== false ? (
                      <button 
                        onClick={() => handleDelete(funcionario.id)} 
                        className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" 
                        title="Desativar"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleReactivate(funcionario.id)} 
                        className="text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors" 
                        title="Reativar"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            Carregando dados...
          </div>
        ) : filteredFuncionarios.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          filteredFuncionarios.map((funcionario) => (
            <div key={funcionario.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 relative overflow-hidden ${funcionario.ativo === false ? 'opacity-75 bg-gray-50/50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <button aria-label={`Selecionar ${funcionario.nome}`} aria-pressed={selectedIds.includes(funcionario.id)} onClick={() => handleSelect(funcionario.id)} className="text-gray-400 hover:text-blue-600 transition-colors -ml-1">
                    {selectedIds.includes(funcionario.id) ? (
                      <CheckSquare className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Square className="h-6 w-6" />
                    )}
                  </button>
                  <EmployeeAvatar nome={funcionario.nome} photoPath={funcionario.photo_path} className="w-12 h-12" />
                  <div>
                    <h4 className="font-semibold text-gray-900 leading-tight">{funcionario.nome}</h4>
                    <span className={`mt-1 inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      funcionario.tipo_colaborador === 'CLT' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {funcionario.tipo_colaborador || 'DIARISTA'}
                    </span>
                  </div>
                </div>
                {funcionario.ativo !== false ? (
                  <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-green-100 text-green-800 uppercase tracking-wider">
                    Ativo
                  </span>
                ) : (
                  <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-gray-200 text-gray-700 uppercase tracking-wider">
                    Inativo
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3 rounded-lg border border-gray-100/50 text-sm">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Função</p>
                  <p className="font-medium text-gray-900 truncate">{funcionario.funcao?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Obra</p>
                  <p className="font-medium text-gray-900 truncate">{funcionario.obra?.nome || '-'}</p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button 
                  onClick={() => handleEdit(funcionario)} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
                {funcionario.ativo !== false ? (
                  <button 
                    onClick={() => handleDelete(funcionario.id)} 
                    className="flex items-center justify-center p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors shrink-0" 
                    title="Desativar"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReactivate(funcionario.id)} 
                    className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors shrink-0" 
                    title="Reativar"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <RelatorioFuncionarios />

      {/* Registration/Edit Modal */}
      {isModalOpen && (
        <CenteredDialog labelId="employee-dialog-title" onClose={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 id="employee-dialog-title" className="text-xl font-bold text-gray-900">
                {editId ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
              </h3>
              <button 
                disabled={saving}
                onClick={closeModal} 
                aria-label="Fechar ficha do funcionário"
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
              {formError && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-100">
                  <p role="alert" className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form id="funcionarioForm" onSubmit={handleSubmit}>
                <fieldset disabled={saving} className="space-y-8 min-w-0">
                
                {/* Photo Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : !removeFoto && currentPhotoPath ? (
                        <EmployeeAvatar nome={nome || 'A'} photoPath={currentPhotoPath} className="w-full h-full" />
                      ) : (
                        <User className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <label 
                      htmlFor="foto" 
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors transform translate-x-1 translate-y-1"
                      title="Alterar foto"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <input
                        type="file"
                        id="foto"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="sr-only"
                        aria-label="Selecionar foto do funcionário"
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{nome || 'Novo funcionário'}</h4>
                    <p className="text-sm text-gray-600 mb-2">{tipoColaborador}{editEmployee && ` · ${editEmployee.ativo ? 'Ativo' : 'Inativo'}`}</p>
                    <p className="text-sm text-gray-500 mb-3">Recomendado: imagem quadrada, formato JPG ou PNG.</p>
                    {((currentPhotoPath && !removeFoto) || previewUrl) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Personal Info Section */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informações Pessoais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        id="nome"
                        required
                        value={nome}
                        onChange={(e) => { setNome(e.target.value); markDirty(); }}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                        placeholder="Ex: João da Silva"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="funcao" className="block text-sm font-medium text-gray-700 mb-1">
                        Função
                      </label>
                      <select
                        id="funcao"
                        required
                        value={funcaoId}
                        onChange={(e) => { setFuncaoId(e.target.value); markDirty(); }}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                      >
                        <option value="" disabled>Selecione uma função</option>
                        {editEmployee?.funcao && !funcoes.some(f => f.id === editEmployee.funcao_id) && <option value={editEmployee.funcao_id}>{editEmployee.funcao.nome} (atual)</option>}
                        {funcoes.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="obra" className="block text-sm font-medium text-gray-700 mb-1">
                        Obra / Local de Trabalho
                      </label>
                      <select
                        id="obra"
                        required
                        value={obraId}
                        onChange={(e) => { setObraId(e.target.value); markDirty(); }}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                      >
                        <option value="" disabled>Selecione uma obra</option>
                        {editEmployee?.obra && !obras.some(o => o.id === editEmployee.obra_id) && <option value={editEmployee.obra_id}>{editEmployee.obra.nome} (atual)</option>}
                        {obras.filter(o => !o.parent_obra_id).map(o => (
                          <optgroup key={o.id} label={o.nome}>
                            <option value={o.id}>{o.nome} (Principal)</option>
                            {obras.filter(sub => sub.parent_obra_id === o.id).map(sub => (
                              <option key={sub.id} value={sub.id}>- {sub.nome}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="tipoColaborador" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Colaborador
                      </label>
                      <select
                        id="tipoColaborador"
                        required
                        value={tipoColaborador}
                        onChange={(e) => { setTipoColaborador(e.target.value as "DIARISTA" | "CLT"); markDirty(); }}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                      >
                        <option value="DIARISTA">Diarista</option>
                        <option value="CLT">CLT</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Info Section */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Informações de Pagamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="md:col-span-2">
                      <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        id="formaPagamento"
                        value={formaPagamento}
                        onChange={(e) => { setFormaPagamento(e.target.value as any); markDirty(); }}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="CAIXA ECONOMICA FEDERAL">Caixa Econômica Federal</option>
                        <option value="PIX">PIX</option>
                      </select>
                    </div>

                    {formaPagamento === 'CAIXA ECONOMICA FEDERAL' && (
                      <>
                        <div>
                          <label htmlFor="agencia" className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                          <input
                            type="text"
                            id="agencia"
                            value={agencia}
                            onChange={(e) => { setAgencia(e.target.value); markDirty(); }}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                            placeholder="Ex: 0001"
                          />
                        </div>
                        <div>
                          <label htmlFor="tipoConta" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                          <select
                            id="tipoConta"
                            value={tipoConta}
                            onChange={(e) => { setTipoConta(e.target.value as any); markDirty(); }}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                          >
                            <option value="">Selecione...</option>
                            <option value="CONTA CORRENTE">Conta Corrente</option>
                            <option value="CONTA POUPANÇA">Conta Poupança</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="conta" className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                          <input
                            type="text"
                            id="conta"
                            value={conta}
                            onChange={(e) => { setConta(e.target.value); markDirty(); }}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                            placeholder="Ex: 12345-6"
                          />
                        </div>
                      </>
                    )}

                    {formaPagamento === 'PIX' && (
                      <div className="md:col-span-2">
                        <label htmlFor="chavePix" className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                        <input
                          type="text"
                          id="chavePix"
                          value={chavePix}
                          onChange={(e) => { setChavePix(e.target.value); markDirty(); }}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                          placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label htmlFor="observacaoPagamento" className="block text-sm font-medium text-gray-700 mb-1">
                        Observação de Pagamento
                      </label>
                      <textarea
                        id="observacaoPagamento"
                        value={observacaoPagamento}
                        onChange={(e) => { setObservacaoPagamento(e.target.value); markDirty(); }}
                        rows={2}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
                        placeholder="Ex: Conta em nome da esposa..."
                      />
                    </div>
                  </div>
                </div>

                </fieldset>
              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="funcionarioForm"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  editId ? 'Salvar alterações' : 'Cadastrar funcionário'
                )}
              </button>
            </div>
          </div>
        </CenteredDialog>
      )}
    </div>
  );
}
