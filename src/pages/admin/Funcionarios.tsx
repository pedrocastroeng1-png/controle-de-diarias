import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Funcionario, Funcao, Obra } from '../../lib/types';
import { Edit2, Ban, Plus, RefreshCcw } from 'lucide-react';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  
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
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    setErro('');
    try {
      const [funcs, funcsData, obsData] = await Promise.all([
        api.getFuncionarios(filter),
        api.getFuncoes(),
        api.getObras()
      ]);
      setFuncionarios(funcs);
      setFuncoes(funcsData);
      setObras(obsData);
    } catch (error) {
      setErro('Ocorreu um erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !funcaoId || !obraId || saving) return;
    setSaving(true);
    setErro('');
    try {
      const payload: Partial<Funcionario> = { 
        nome, 
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

      let fId = editId;
      if (editId) {
        await api.updateFuncionario(editId, payload);
      } else {
        const created = await api.createFuncionario(payload as any);
        fId = created.id;
      }

      if (removeFoto && fId) {
        await api.updateFuncionario(fId, { photo_path: null });
      } else if (foto && fId) {
        const path = await api.uploadEmployeePhoto(foto, fId);
        await api.updateFuncionario(fId, { photo_path: path });
      }

      setNome('');
      setFuncaoId('');
      setObraId(''); setTipoColaborador('DIARISTA');
      setFormaPagamento('');
      setAgencia('');
      setTipoConta('');
      setConta('');
      setChavePix('');
      setObservacaoPagamento('');
      setFoto(null);
      setEditId(null);
      await loadData();
    } catch (error: any) {
      console.error("Upload error details:", error);
      const msg = error.message ? error.message : JSON.stringify(error);
      const status = error.statusCode ? `(Status: ${error.statusCode})` : '';
      const errObj = error.error ? `[${error.error}]` : '';
      setErro(`Ocorreu um erro: ${msg} ${status} ${errObj}`);
    } finally {
      setSaving(false);
    }
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

  function handleEdit(funcionario: Funcionario) {
    setEditId(funcionario.id);
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
  }

  const filteredFuncionarios = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Funcionários</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setFilter('todos')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('ativos')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'ativos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilter('inativos')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'inativos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Inativos
            </button>
          </div>
          <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Pesquisar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          </div>
        </div>
      </div>
      
      {erro && (<div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{erro}</div>)}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="funcao" className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <select
              id="funcao"
              value={funcaoId}
              onChange={(e) => setFuncaoId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="" disabled>Selecione</option>
              {funcoes.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="obra" className="block text-sm font-medium text-gray-700 mb-1">
              Obra
            </label>
            <select
              id="obra"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="" disabled>Selecione</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoColaborador" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="tipoColaborador"
              value={tipoColaborador}
              onChange={(e) => setTipoColaborador(e.target.value as any)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="DIARISTA">DIARISTA</option>
              <option value="CLT">CLT</option>
            </select>
          </div>
          
          <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                id="formaPagamento"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as any)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Não informada</option>
                <option value="CAIXA ECONOMICA FEDERAL">Caixa Econômica Federal</option>
                <option value="PIX">PIX</option>
              </select>
            </div>
            
            {formaPagamento === 'CAIXA ECONOMICA FEDERAL' && (
              <>
                <div>
                  <label htmlFor="agencia" className="block text-sm font-medium text-gray-700 mb-1">
                    Agência
                  </label>
                  <input
                    type="text"
                    id="agencia"
                    value={agencia}
                    onChange={(e) => setAgencia(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: 1234"
                  />
                </div>
                <div>
                  <label htmlFor="tipoConta" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    id="tipoConta"
                    value={tipoConta}
                    onChange={(e) => setTipoConta(e.target.value as any)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Selecione</option>
                    <option value="CONTA CORRENTE">Conta Corrente</option>
                    <option value="CONTA POUPANÇA">Conta Poupança</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="conta" className="block text-sm font-medium text-gray-700 mb-1">
                    Conta
                  </label>
                  <input
                    type="text"
                    id="conta"
                    value={conta}
                    onChange={(e) => setConta(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: 12345-6"
                  />
                </div>
              </>
            )}

            {formaPagamento === 'PIX' && (
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="chavePix" className="block text-sm font-medium text-gray-700 mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  id="chavePix"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                />
              </div>
            )}
          </div>
          
          <div className="col-span-1 md:col-span-4">
            <label htmlFor="observacaoPagamento" className="block text-sm font-medium text-gray-700 mb-1">
              Observação de Pagamento
            </label>
            <input
              type="text"
              id="observacaoPagamento"
              value={observacaoPagamento}
              onChange={(e) => setObservacaoPagamento(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ex: Conta bancária em nome de Maria da Silva, esposa do funcionário."
            />
          </div>

          <div className="col-span-1 md:col-span-4">
            <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
              Foto do Funcionário
            </label>
            <input
              type="file"
              id="foto"
              accept="image/*"
              onChange={(e) => { setFoto(e.target.files?.[0] || null); setRemoveFoto(false); }}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            />
            {(foto || (editId && funcionarios.find(f => f.id === editId)?.photo_path && !removeFoto)) && (
              <div className="mt-2 relative inline-block">
                <img src={foto ? URL.createObjectURL(foto) : imageUrls[editId!] || ''} className="h-20 w-20 object-cover rounded-md border border-gray-300" alt="Preview" />
                <button type="button" onClick={() => { setFoto(null); setRemoveFoto(true); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <span className="sr-only">Remover</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>
          <div className="col-span-1 md:col-span-5 flex justify-end gap-3 mt-2">
            {editId && (
              <button
                type="button"
                onClick={() => { setEditId(null); setNome(''); setFuncaoId(''); setObraId(''); setFoto(null); setRemoveFoto(false); }}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors h-[42px]"
              >
                Cancelar
              </button>
            )}
            <button
            type="submit"
            disabled={saving}
              className="flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors h-[42px]"
            >
              {editId ? 'Salvar' : <><Plus className="h-4 w-4 mr-2" /> Salvar</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obra
                </th>
                <th scope="col" className="relative px-6 py-3 w-24 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={11} className="px-6 py-8 text-center text-sm text-gray-500">Carregando...</td></tr>
            ) : (
              filteredFuncionarios.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                     Nenhum funcionário encontrado.
                   </td>
                </tr>
              ) : filteredFuncionarios.map((funcionario) => (
                <tr key={funcionario.id} className={`hover:bg-gray-50 ${funcionario.ativo === false ? 'opacity-75' : ''}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${funcionario.ativo === false ? 'text-gray-500' : 'text-gray-900'}`}>
                    {funcionario.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {funcionario.ativo !== false ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        INATIVO
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.tipo_colaborador || 'DIARISTA'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.funcao?.nome || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.obra?.nome || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3 justify-center">
                    <button onClick={() => handleEdit(funcionario)} className="text-blue-600 hover:text-blue-900 p-1" title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {funcionario.ativo !== false ? (
                      <button onClick={() => handleDelete(funcionario.id)} className="text-red-600 hover:text-red-900 p-1" title="Desativar">
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(funcionario.id)} className="text-green-600 hover:text-green-900 p-1" title="Reativar">
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
