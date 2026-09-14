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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Funcionários
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o cadastro, informações e obras dos colaboradores.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Funcionário
        </button>
      </div>

      {erro && !isModalOpen && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex w-full md:w-auto p-1 bg-gray-100 rounded-lg">
          {(['todos', 'ativos', 'inativos'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === opt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80 px-1 pb-1 md:px-0 md:pb-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none pb-1 md:pb-0">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            aria-label="Buscar funcionário por nome"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-transparent hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded-lg sm:text-sm bg-gray-50 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm text-gray-500">
        <span aria-live="polite" className="font-medium">
          {loading ? 'Atualizando...' : `${filteredFuncionarios.length} de ${funcionarios.length} registros`}
        </span>
        <button type="button" onClick={() => void loadData()} disabled={loading} className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-1">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Mass Edit Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-blue-900">funcionários selecionados</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100/50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowMassEdit(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              Alterar Obra
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 w-12 text-center">
                <button aria-label="Selecionar todos" aria-pressed={allSelected} disabled={loading || !visibleIds.length} onClick={handleSelectAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                  {allSelected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
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
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
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
              <tr key={funcionario.id} className={`hover:bg-gray-50/50 transition-colors ${funcionario.ativo === false ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button aria-label={`Selecionar ${funcionario.nome}`} aria-pressed={selectedIds.includes(funcionario.id)} onClick={() => handleSelect(funcionario.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    {selectedIds.includes(funcionario.id) ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <EmployeeAvatar nome={funcionario.nome} photoPath={funcionario.photo_path} className="w-12 h-12 shadow-sm border border-gray-100" />
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900">{funcionario.nome}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">{funcionario.tipo_colaborador || 'DIARISTA'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{funcionario.funcao?.nome || '-'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{funcionario.obra?.nome || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {funcionario.ativo !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex gap-2 justify-end">
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
                        className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors" 
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
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">Carregando dados...</div>
        ) : filteredFuncionarios.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          filteredFuncionarios.map((funcionario) => (
            <div key={funcionario.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden transition-all ${funcionario.ativo === false ? 'opacity-75 bg-gray-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <button aria-label={`Selecionar ${funcionario.nome}`} aria-pressed={selectedIds.includes(funcionario.id)} onClick={() => handleSelect(funcionario.id)} className="text-gray-400 hover:text-blue-600 transition-colors -ml-1">
                    {selectedIds.includes(funcionario.id) ? <CheckSquare className="h-6 w-6 text-blue-600" /> : <Square className="h-6 w-6" />}
                  </button>
                  <EmployeeAvatar nome={funcionario.nome} photoPath={funcionario.photo_path} className="w-14 h-14 shadow-sm border border-gray-100" />
                  <div className="flex flex-col">
                    <h4 className="font-bold text-gray-900 leading-tight">{funcionario.nome}</h4>
                    <span className={`mt-1 inline-flex w-fit px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      funcionario.tipo_colaborador === 'CLT' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {funcionario.tipo_colaborador || 'DIARISTA'}
                    </span>
                  </div>
                </div>
                {funcionario.ativo !== false ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Ativo
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    Inativo
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-sm mt-1">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Função</p>
                  <p className="font-semibold text-gray-900 truncate">{funcionario.funcao?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Obra</p>
                  <p className="font-semibold text-gray-900 truncate">{funcionario.obra?.nome || '-'}</p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-4 mt-1">
                <button 
                  onClick={() => handleEdit(funcionario)} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
                {funcionario.ativo !== false ? (
                  <button 
                    onClick={() => handleDelete(funcionario.id)} 
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                  >
                    <Ban className="h-4 w-4" />
                    Desativar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReactivate(funcionario.id)} 
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium text-sm hover:bg-emerald-100 transition-colors"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reativar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <RelatorioFuncionarios />

      {isModalOpen && (<CenteredDialog labelId="employee-dialog-title" onClose={closeModal}>
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200">
<div className="flex items-center justify-between p-5 border-b border-gray-100">
<h3 id="employee-dialog-title" className="text-xl font-bold text-gray-900">{editId ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
<button aria-label="Fechar" disabled={saving} onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
</div>
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
          {formError && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 leading-relaxed">{formError}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              
              <div className="flex justify-center pb-2">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center transition-colors">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentPhotoPath ? (
                       <EmployeeAvatar nome={nome || 'Preview'} photoPath={currentPhotoPath} className="w-full h-full" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs font-medium">Add Foto</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-transform hover:scale-105">
                    <Upload className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                  {(previewUrl || currentPhotoPath) && (
                    <button type="button" onClick={handleRemovePhoto} className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-red-600 transition-transform hover:scale-105" title="Remover foto">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => { setNome(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-2.5 border outline-none"
                  placeholder="Nome do colaborador"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Colaborador *</label>
                  <select
                    required
                    value={tipoColaborador}
                    onChange={e => { setTipoColaborador(e.target.value as any); markDirty(); }}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors px-4 py-2.5 border outline-none"
                  >
                    <option value="DIARISTA">Diarista</option>
                    <option value="CLT">CLT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                  <select
                    required
                    value={funcaoId}
                    onChange={e => { setFuncaoId(e.target.value); markDirty(); }}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors px-4 py-2.5 border outline-none"
                  >
                    <option value="">Selecione uma função</option>
                    {funcoes.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obra Alocada *</label>
                <select
                  required
                  value={obraId}
                  onChange={e => { setObraId(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors px-4 py-2.5 border outline-none"
                >
                  <option value="">Selecione uma obra</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 -mx-6 px-6 py-6 border-t border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  Dados Bancários (Opcional)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={e => { setFormaPagamento(e.target.value as any); markDirty(); }}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors px-4 py-2.5 border outline-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="CAIXA ECONOMICA FEDERAL">Caixa Econômica Federal</option>
                      <option value="PIX">Pix</option>
                    </select>
                  </div>

                  {formaPagamento === 'CAIXA ECONOMICA FEDERAL' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta *</label>
                        <select
                          required
                          value={tipoConta}
                          onChange={e => { setTipoConta(e.target.value as any); markDirty(); }}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors px-4 py-2.5 border outline-none"
                        >
                          <option value="">Selecione...</option>
                          <option value="CONTA CORRENTE">Conta Corrente</option>
                          <option value="CONTA POUPANÇA">Conta Poupança</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência *</label>
                        <input
                          type="text"
                          required
                          value={agencia}
                          onChange={e => { setAgencia(e.target.value); markDirty(); }}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-2.5 border outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta *</label>
                        <input
                          type="text"
                          required
                          value={conta}
                          onChange={e => { setConta(e.target.value); markDirty(); }}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-2.5 border outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {formaPagamento === 'PIX' && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pix *</label>
                      <input
                        type="text"
                        required
                        value={chavePix}
                        onChange={e => { setChavePix(e.target.value); markDirty(); }}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-2.5 border outline-none"
                        placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Pagamento</label>
                    <textarea
                      value={observacaoPagamento}
                      onChange={e => { setObservacaoPagamento(e.target.value); markDirty(); }}
                      rows={2}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-2.5 border outline-none"
                      placeholder="Ex: Conta no nome da esposa..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <RefreshCcw className="w-4 h-4 animate-spin" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
</div>
</CenteredDialog>
)}

      {showMassEdit && (<CenteredDialog labelId="mass-edit-title" onClose={closeMassEdit}>
<div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
<div className="flex items-center justify-between p-4 border-b border-gray-100">
<h3 id="mass-edit-title" className="text-lg font-bold text-gray-900">Alteração em Massa</h3>
<button aria-label="Fechar" disabled={massEditSaving} onClick={closeMassEdit} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
</div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Selecione a nova obra para os {selectedIds.length} funcionários selecionados:
          </p>
          <div className="space-y-4">
            <select
              value={massEditObraId}
              onChange={(e) => setMassEditObraId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2.5 border outline-none"
            >
              <option value="">Selecione a obra destino</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={closeMassEdit}
              disabled={massEditSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleMassEdit}
              disabled={massEditSaving || !massEditObraId}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {massEditSaving && <RefreshCcw className="w-4 h-4 animate-spin" />}
              {massEditSaving ? 'Alterando...' : 'Confirmar Alteração'}
            </button>
          </div>
        </div>
      </div>
</CenteredDialog>
)}
    </div>
  );
}
