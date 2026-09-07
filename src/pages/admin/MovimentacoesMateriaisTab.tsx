import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { apiMateriais } from '../../lib/api-materiais';
import { Obra, MaterialCategory, Material, VwMovimentacoesMateriais, VwEstoqueMateriais } from '../../lib/types';
import { Plus, Search, Loader2, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, AlertTriangle, FileWarning, Filter, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MovimentacoesMateriaisTab() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<MaterialCategory[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<VwMovimentacoesMateriais[]>([]);
  const [estoque, setEstoque] = useState<VwEstoqueMateriais[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Filters
  const [filterObra, setFilterObra] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Form
  const [formData, setFormData] = useState({
    tipo: 'SAIDA' as any,
    material_id: '',
    obra_id: '',
    quantidade: '',
    data_movimento: format(new Date(), 'yyyy-MM-dd'),
    motivo: '',
    observacao: '',
    obra_destino_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [obrasData, matData, catData, movData, estData] = await Promise.all([
        api.getObras(),
        api.getMateriais(),
        api.getMaterialCategories(),
        apiMateriais.getMovimentacoesMateriais(),
        apiMateriais.getEstoqueMateriais()
      ]);
      setObras(obrasData);
      setMateriais(matData);
      setCategorias(catData);
      setMovimentacoes(movData);
      setEstoque(estData);
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hierarchy = useMemo(() => {
    const principais = obras.filter(o => !o.parent_obra_id);
    return principais.map(p => ({
      ...p,
      subobras: obras.filter(o => o.parent_obra_id === p.id)
    }));
  }, [obras]);

  const filteredMovs = useMemo(() => {
    return movimentacoes.filter(m => {
      if (filterObra !== 'todas' && m.obra_id !== filterObra && m.obra_principal_id !== filterObra && m.obra_destino_id !== filterObra) return false;
      if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false;
      return true;
    });
  }, [movimentacoes, filterObra, filterTipo]);

  const currentEstoque = useMemo(() => {
    if (!formData.material_id || !formData.obra_id) return null;
    return estoque.find(e => e.material_id === formData.material_id && e.obra_id === formData.obra_id) || { saldo: 0, unidade: '' };
  }, [formData.material_id, formData.obra_id, estoque]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!formData.material_id || !formData.obra_id || !formData.quantidade || Number(formData.quantidade) <= 0) {
      setSubmitError('Preencha os campos obrigatórios corretamente.');
      return;
    }
    
    if (formData.tipo === 'TRANSFERENCIA') {
      if (!formData.obra_destino_id) {
        setSubmitError('Selecione a obra de destino para transferência.');
        return;
      }
      if (formData.obra_id === formData.obra_destino_id) {
        setSubmitError('A obra de origem e a obra de destino precisam ser diferentes.');
        return;
      }
    }
    
    if (formData.tipo === 'PERDA' && !formData.motivo) {
      setSubmitError('O motivo é obrigatório para registrar perda.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiMateriais.registrarMovimentacao({
        ...formData,
        quantidade: Number(formData.quantidade)
      });
      setIsModalOpen(false);
      setFormData({
        tipo: 'SAIDA',
        material_id: '',
        obra_id: '',
        quantidade: '',
        data_movimento: format(new Date(), 'yyyy-MM-dd'),
        motivo: '',
        observacao: '',
        obra_destino_id: ''
      });
      // reload
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch(tipo) {
      case 'ENTRADA': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowUpCircle className="w-3 h-3"/> ENTRADA</span>;
      case 'SAIDA': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowDownCircle className="w-3 h-3"/> SAÍDA</span>;
      case 'TRANSFERENCIA': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowRightLeft className="w-3 h-3"/> TRANSFERÊNCIA</span>;
      case 'PERDA': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3"/> PERDA</span>;
      case 'AJUSTE_ENTRADA': return <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowUpCircle className="w-3 h-3"/> AJ. ENTRADA</span>;
      case 'AJUSTE_SAIDA': return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowDownCircle className="w-3 h-3"/> AJ. SAÍDA</span>;
      default: return tipo;
    }
  };

  if (loading && movimentacoes.length === 0) {
    return <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /> Carregando movimentações...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filterObra}
            onChange={(e) => setFilterObra(e.target.value)}
          >
            <option value="todas">TODAS AS OBRAS</option>
            {hierarchy.map(p => (
              <optgroup key={p.id} label={p.nome}>
                <option value={p.id}>{p.nome}</option>
                {p.subobras?.map(s => (
                  <option key={s.id} value={s.id}>&nbsp;&nbsp;↳ {s.nome}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <option value="todos">Todos os Tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="PERDA">Perda</option>
            <option value="AJUSTE_ENTRADA">Ajuste Entrada</option>
            <option value="AJUSTE_SAIDA">Ajuste Saída</option>
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nova Movimentação
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qtd</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filteredMovs.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {format(parseISO(m.data_movimento), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {getTipoLabel(m.tipo)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {m.material} <span className="text-gray-400 text-xs ml-1">({m.categoria})</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {m.quantidade} <span className="text-xs text-gray-500 font-normal">{m.unidade}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {m.obra}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {m.obra_destino || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {m.motivo || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Registrar Movimentação Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
                  <FileWarning className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{submitError}</p>
                </div>
              )}
              
              <form id="mov-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimentação*</label>
                    <select 
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                      required
                    >
                      <option value="SAIDA">SAÍDA</option>
                      <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
                      <option value="PERDA">PERDA</option>
                      <option value="AJUSTE_ENTRADA">AJUSTE (ENTRADA)</option>
                      <option value="AJUSTE_SAIDA">AJUSTE (SAÍDA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data*</label>
                    <input 
                      type="date"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.data_movimento}
                      onChange={(e) => setFormData({...formData, data_movimento: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material*</label>
                  <select 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.material_id}
                    onChange={(e) => setFormData({...formData, material_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione o material...</option>
                    {categorias.map(cat => (
                      <optgroup key={cat.id} label={cat.nome}>
                        {materiais.filter(m => m.categoria_id === cat.id).map(m => (
                          <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obra (Origem)*</label>
                    <select 
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.obra_id}
                      onChange={(e) => setFormData({...formData, obra_id: e.target.value})}
                      required
                    >
                      <option value="">Selecione a obra...</option>
                      {hierarchy.map(p => (
                        <optgroup key={p.id} label={p.nome}>
                          <option value={p.id}>{p.nome}</option>
                          {p.subobras?.map(s => (
                            <option key={s.id} value={s.id}>&nbsp;&nbsp;↳ {s.nome}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  {formData.tipo === 'TRANSFERENCIA' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Obra (Destino)*</label>
                      <select 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={formData.obra_destino_id}
                        onChange={(e) => setFormData({...formData, obra_destino_id: e.target.value})}
                        required
                      >
                        <option value="">Selecione a obra de destino...</option>
                        {hierarchy.map(p => (
                          <optgroup key={p.id} label={p.nome}>
                            <option value={p.id}>{p.nome}</option>
                            {p.subobras?.map(s => (
                              <option key={s.id} value={s.id}>&nbsp;&nbsp;↳ {s.nome}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Estoque Atual na Origem</p>
                    <p className="font-bold text-lg text-gray-900">
                      {currentEstoque ? `${currentEstoque.saldo} ${currentEstoque.unidade}` : '-'}
                    </p>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade*</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saldo Após Operação</p>
                    <p className={`font-bold text-lg ${
                      !formData.quantidade || !currentEstoque ? 'text-gray-900' :
                      (['SAIDA', 'PERDA', 'TRANSFERENCIA', 'AJUSTE_SAIDA'].includes(formData.tipo)) 
                        ? (currentEstoque.saldo - Number(formData.quantidade) < 0 ? 'text-red-600' : 'text-blue-600')
                        : 'text-green-600'
                    }`}>
                      {!formData.quantidade || !currentEstoque ? '-' : 
                       (['SAIDA', 'PERDA', 'TRANSFERENCIA', 'AJUSTE_SAIDA'].includes(formData.tipo))
                        ? (currentEstoque.saldo - Number(formData.quantidade)).toFixed(2)
                        : (currentEstoque.saldo + Number(formData.quantidade)).toFixed(2)
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo {['PERDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA'].includes(formData.tipo) && '*'}
                  </label>
                  <input 
                    type="text"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.motivo}
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                    required={['PERDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA'].includes(formData.tipo)}
                    placeholder="Ex: Contagem física, Quebra, Material danificado..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                  <textarea 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="mov-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Registrar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
