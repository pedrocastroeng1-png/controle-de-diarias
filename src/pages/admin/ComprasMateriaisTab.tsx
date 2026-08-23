import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, FileText, ChevronLeft, Save, X, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

export default function ComprasMateriaisTab() {
  const { usuario } = useAuth();
  
  // Views: 'list', 'new', 'details'
  const [view, setView] = useState<'list' | 'new' | 'details'>('list');
  
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection / Detail
  const [selectedCompra, setSelectedCompra] = useState<any>(null);
  
  // Form State
  const [obras, setObras] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const [compraForm, setCompraForm] = useState({
    data_compra: format(new Date(), 'yyyy-MM-dd'),
    obra_id: '',
    fornecedor: '',
    numero_recibo: '',
    observacao: ''
  });
  
  const [itensForm, setItensForm] = useState<any[]>([]);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [comprasData, obrasData, materiaisData, categoriasData] = await Promise.all([
        api.getComprasMateriais(),
        api.getObras(),
        api.getMateriais(),
        api.getMaterialCategories()
      ]);
      setCompras(comprasData);
      setObras(obrasData);
      setMateriais(materiaisData);
      setCategorias(categoriasData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setCompraForm({
      data_compra: format(new Date(), 'yyyy-MM-dd'),
      obra_id: '',
      fornecedor: '',
      numero_recibo: '',
      observacao: ''
    });
    setItensForm([]);
    setFormError('');
    setFormSuccess('');
    setView('new');
  };

  const handleViewDetails = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.getCompraDetalhes(id);
      setSelectedCompra(data);
      setView('details');
    } catch (err: any) {
      alert('Erro ao carregar detalhes da compra: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItensForm([
      ...itensForm, 
      { id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0 }
    ]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItensForm(itensForm.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Reset material if category changes
        if (field === 'categoria_id') {
          updated.material_id = '';
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItensForm(itensForm.filter(item => item.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!compraForm.data_compra) {
      return setFormError('A data da compra é obrigatória.');
    }
    if (!compraForm.obra_id) {
      return setFormError('A obra é obrigatória.');
    }
    if (itensForm.length === 0) {
      return setFormError('Adicione pelo menos um item à compra.');
    }

    // Validate Items
    let totalCompra = 0;
    const itensValidos = [];

    for (let i = 0; i < itensForm.length; i++) {
      const item = itensForm[i];
      if (!item.material_id) {
        return setFormError(`Selecione o produto para o item ${i + 1}.`);
      }
      if (item.quantidade <= 0) {
        return setFormError(`A quantidade do item ${i + 1} deve ser maior que zero.`);
      }
      if (item.valor_unitario < 0) {
        return setFormError(`O valor unitário do item ${i + 1} não pode ser negativo.`);
      }
      
      const totalItem = item.quantidade * item.valor_unitario;
      totalCompra += totalItem;
      
      itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        
      });
    }

    try {
      setIsSaving(true);
      
      const payloadCompra = {
        ...compraForm,
        
        registrado_por: usuario?.id
      };
      
      await api.createCompraMaterial(payloadCompra, itensValidos);
      
      setFormSuccess('Compra registrada com sucesso!');
      await fetchData();
      
      setTimeout(() => {
        setView('list');
      }, 1500);
      
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar compra.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // LIST VIEW
  if (view === 'list') {
    const filteredCompras = compras.filter(c => 
      c.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.obra?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numero_recibo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fornecedor, obra ou recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Compra
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompras.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma compra encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredCompras.map(compra => (
                    <tr key={compra.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(compra.data_compra + 'T00:00:00'), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {compra.obra?.nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {compra.fornecedor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(compra.total_calculado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(compra.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 justify-end w-full"
                        >
                          <Eye className="w-4 h-4" /> Detalhes
                        </button>
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

  // DETAILS VIEW
  if (view === 'details' && selectedCompra) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('list')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Compra</h2>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Data da Compra</p>
              <p className="text-base text-gray-900 mt-1">
                {format(new Date(selectedCompra.data_compra + 'T00:00:00'), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Obra</p>
              <p className="text-base text-gray-900 mt-1">{selectedCompra.obra?.nome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fornecedor</p>
              <p className="text-base text-gray-900 mt-1">{selectedCompra.fornecedor || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nº do Recibo</p>
              <p className="text-base text-gray-900 mt-1">{selectedCompra.numero_recibo || '-'}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <p className="text-sm font-medium text-gray-500">Observação</p>
              <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{selectedCompra.observacao || '-'}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Itens da Compra</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCompra.itens?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{item.material?.nome}</div>
                        <div className="text-xs text-gray-500">{item.material?.category?.nome}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.quantidade}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.material?.unidade}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_unitario)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      Total da Compra:
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-base font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCompra.total_calculado)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="mt-6 text-sm text-gray-500 text-right">
              Registrado por: <span className="font-medium text-gray-900">{selectedCompra.registrador?.usuario}</span> em {format(new Date(selectedCompra.created_at), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW PURCHASE FORM
  return (
    <form onSubmit={handleSave} className="space-y-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <p className="text-sm font-medium">{formError}</p>
        </div>
      )}
      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <p className="text-sm font-medium">{formSuccess}</p>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Compra</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra *</label>
            <input
              type="date"
              required
              value={compraForm.data_compra}
              onChange={e => setCompraForm({...compraForm, data_compra: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Obra *</label>
            <select
              required
              value={compraForm.obra_id}
              onChange={e => setCompraForm({...compraForm, obra_id: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Selecione uma obra...</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>{obra.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <input
              type="text"
              placeholder="Nome do fornecedor ou loja"
              value={compraForm.fornecedor}
              onChange={e => setCompraForm({...compraForm, fornecedor: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº do Recibo / NFe</label>
            <input
              type="text"
              placeholder="Ex: 12345"
              value={compraForm.numero_recibo}
              onChange={e => setCompraForm({...compraForm, numero_recibo: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <textarea
              rows={2}
              value={compraForm.observacao}
              onChange={e => setCompraForm({...compraForm, observacao: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Itens da Compra</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        {itensForm.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            Nenhum item adicionado. Clique no botão acima para inserir os produtos comprados.
          </div>
        ) : (
          <div className="space-y-4">
            {itensForm.map((item, index) => {
              const catMateriais = materiais.filter(m => m.categoria_id === item.categoria_id);
              const selectedMaterial = materiais.find(m => m.id === item.material_id);
              const totalItem = (item.quantidade || 0) * (item.valor_unitario || 0);

              return (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 text-sm">Item {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                      <select
                        value={item.categoria_id}
                        onChange={e => updateItem(item.id, 'categoria_id', e.target.value)}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Categoria...</option>
                        {categorias.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produto *</label>
                      <select
                        required
                        disabled={!item.categoria_id}
                        value={item.material_id}
                        onChange={e => updateItem(item.id, 'material_id', e.target.value)}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                      >
                        <option value="">Produto...</option>
                        {catMateriais.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Qtd *</label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={item.quantidade === 0 ? '' : item.quantidade}
                          onChange={e => updateItem(item.id, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unid.</label>
                        <input
                          type="text"
                          disabled
                          value={selectedMaterial?.unidade || ''}
                          className="w-full text-sm rounded border border-gray-200 bg-gray-100 text-gray-600 px-2 py-1.5 text-center font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Valor Unit. *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.valor_unitario === 0 ? '' : item.valor_unitario}
                          onChange={e => updateItem(item.id, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                        <div className="w-full text-sm rounded border border-gray-200 bg-blue-50/50 text-blue-900 px-2 py-1.5 font-medium flex items-center h-[34px] overflow-hidden whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalItem)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-end pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setView('list')}
          disabled={isSaving}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Salvando...' : 'Salvar Compra'}
        </button>
      </div>
    </form>
  );
}
