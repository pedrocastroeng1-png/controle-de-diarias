import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { apiMateriais } from '../../lib/api-materiais';
import { Obra, MaterialCategory, VwEstoqueMateriais, VwEstoqueMateriaisConsolidado } from '../../lib/types';
import { Search, Loader2, Package, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Filter, X } from 'lucide-react';

export default function EstoqueMateriaisTab() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [categorias, setCategorias] = useState<MaterialCategory[]>([]);
  
  const [estoque, setEstoque] = useState<VwEstoqueMateriais[]>([]);
  const [estoqueConsolidado, setEstoqueConsolidado] = useState<VwEstoqueMateriaisConsolidado[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedObraId, setSelectedObraId] = useState<string>('todas');
  const [consolidarSubobras, setConsolidarSubobras] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [obrasData, catData, estData, estConsolidadoData] = await Promise.all([
        api.getObras(),
        api.getMaterialCategories(),
        apiMateriais.getEstoqueMateriais(),
        apiMateriais.getEstoqueMateriaisConsolidado()
      ]);
      setObras(obrasData);
      setCategorias(catData);
      setEstoque(estData);
      setEstoqueConsolidado(estConsolidadoData);
    } catch (err: any) {
      setError('Erro ao carregar estoque: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hierarchy = useMemo(() => {
    const principais = obras.filter(o => !o.parent_obra_id);
    return principais.map(p => ({
      ...p,
      subobras: obras.filter(o => o.parent_obra_id === p.id)
    }));
  }, [obras]);

  const selectedObraIsParent = useMemo(() => {
    if (selectedObraId === 'todas') return false;
    return obras.some(o => o.id === selectedObraId && !o.parent_obra_id);
  }, [selectedObraId, obras]);

  const filteredEstoque = useMemo(() => {
    let rawData: any[] = [];

    if (selectedObraId === 'todas') {
      // Show everything from regular estoque view
      rawData = [...estoque];
    } else {
      if (selectedObraIsParent && consolidarSubobras) {
        rawData = estoqueConsolidado.filter(e => e.obra_principal_id === selectedObraId);
      } else {
        // Obra is parent but NOT consolidated, OR it is a subobra itself
        if (selectedObraIsParent) {
          // Show all items for this parent and its subobras
          rawData = estoque.filter(e => e.obra_principal_id === selectedObraId || e.obra_id === selectedObraId);
        } else {
          // It's a subobra
          rawData = estoque.filter(e => e.obra_id === selectedObraId);
        }
      }
    }

    return rawData.filter(item => {
      // Categoria filter
      if (selectedCategoriaId !== 'todas' && item.categoria_id !== selectedCategoriaId) return false;
      
      // Status filter
      if (selectedStatus === 'com_estoque' && item.saldo <= 0) return false;
      if (selectedStatus === 'zerado' && item.saldo !== 0) return false;
      if (selectedStatus === 'negativo' && item.saldo >= 0) return false;
      
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matMatch = item.material?.toLowerCase().includes(term);
        const catMatch = item.categoria?.toLowerCase().includes(term);
        if (!matMatch && !catMatch) return false;
      }
      
      return true;
    });
  }, [estoque, estoqueConsolidado, selectedObraId, consolidarSubobras, selectedObraIsParent, selectedCategoriaId, selectedStatus, searchTerm]);

  const clearFilters = () => {
    setSelectedObraId('todas');
    setConsolidarSubobras(true);
    setSearchTerm('');
    setSelectedCategoriaId('todas');
    setSelectedStatus('todos');
  };

  // Cards calculations
  const itemsComEstoque = filteredEstoque.filter(i => i.saldo > 0).length;
  const totalEntradas = filteredEstoque.reduce((acc, curr) => acc + (Number(curr.entradas) || 0), 0);
  const totalSaidas = filteredEstoque.reduce((acc, curr) => acc + (Number(curr.saidas) || 0), 0);
  const itemsZerados = filteredEstoque.filter(i => i.saldo === 0).length;
  const itemsNegativos = filteredEstoque.filter(i => i.saldo < 0).length;

  if (loading) {
    return <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /> Carregando estoque...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">{error}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* FILTROS */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Filter className="w-5 h-5 text-gray-400" /> Filtros de Estoque</h3>
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"><X className="w-4 h-4"/> Limpar Filtros</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Obra / Local</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
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
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedCategoriaId}
              onChange={(e) => setSelectedCategoriaId(e.target.value)}
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status do Estoque</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="com_estoque">Com Estoque (&gt; 0)</option>
              <option value="zerado">Zerado (= 0)</option>
              <option value="negativo">Negativo (&lt; 0)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar Material</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Nome ou categoria..."
                className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        {selectedObraIsParent && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input 
              type="checkbox" 
              id="consolidar" 
              checked={consolidarSubobras} 
              onChange={(e) => setConsolidarSubobras(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consolidar" className="text-sm text-gray-700 font-medium">Consolidar subobras (mostrar estoque total do grupo)</label>
          </div>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Itens em Estoque</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{itemsComEstoque}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ArrowUpCircle className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Entradas</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalEntradas}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ArrowDownCircle className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Saídas</span>
          </div>
          <div className="text-3xl font-bold text-orange-600">{totalSaidas}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertTriangle className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Itens Zerados</span>
          </div>
          <div className="text-3xl font-bold text-gray-700">{itemsZerados}</div>
        </div>
        <div className={`bg-white border ${itemsNegativos > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex flex-col`}>
          <div className={`flex items-center gap-2 ${itemsNegativos > 0 ? 'text-red-600' : 'text-gray-500'} mb-2`}>
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Alertas (Negativo)</span>
          </div>
          <div className={`text-3xl font-bold ${itemsNegativos > 0 ? 'text-red-700' : 'text-gray-900'}`}>{itemsNegativos}</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material / Categoria</th>
                {(!selectedObraIsParent || !consolidarSubobras || selectedObraId === 'todas') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entradas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saídas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstoque.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum material em estoque para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEstoque.map((item, index) => {
                  const key = item.id || `${item.obra_id || item.obra_principal_id}-${item.material_id}-${index}`;
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{item.material}</div>
                        <div className="text-xs text-gray-500">{item.categoria}</div>
                      </td>
                      {(!selectedObraIsParent || !consolidarSubobras || selectedObraId === 'todas') && (
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.obra || item.obra_principal}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-right text-blue-600 font-medium">
                        {item.entradas} <span className="text-xs text-gray-400">{item.unidade}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-orange-600 font-medium">
                        {item.saidas} <span className="text-xs text-gray-400">{item.unidade}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                        {item.saldo} <span className="text-xs text-gray-400">{item.unidade}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.saldo > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ESTOQUE OK
                          </span>
                        )}
                        {item.saldo === 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ZERADO
                          </span>
                        )}
                        {item.saldo < 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            NEGATIVO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
