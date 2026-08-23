import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package, Calendar, ChevronDown, ChevronUp, MapPin, Building2, Layers } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { MaterialQuantityRow, MaterialQuantityDetail } from '../../lib/types';

export default function QuantidadeMateriaisTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [quantities, setQuantities] = useState<MaterialQuantityRow[]>([]);
  
  // Filter Options
  const [obras, setObras] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  
  // Filter State
  const [filters, setFilters] = useState({
    obra_id: '',
    categoria_id: '',
    material_id: '',
    data_inicial: '',
    data_final: ''
  });

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadFilterOptions();
    fetchData(); // Initial load
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [obrasData, catData, matData] = await Promise.all([
        api.getObras(),
        api.getMaterialCategories(),
        api.getMateriais()
      ]);
      setObras(obrasData);
      setCategorias(catData);
      setMateriais(matData);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMaterialQuantities(filters);
      setQuantities(data);
      setExpandedRow(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar quantidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const toggleRow = (key: string) => {
    if (expandedRow === key) {
      setExpandedRow(null);
    } else {
      setExpandedRow(key);
    }
  };

  // Filter dependente: Material por Categoria
  const filteredMateriais = filters.categoria_id 
    ? materiais.filter(m => m.categoria_id === filters.categoria_id)
    : materiais;

  // Calculando Resumo (Apenas se tiver dados)
  const uniqueMaterials = new Set(quantities.map(q => q.material_id)).size;
  const totalEntries = quantities.reduce((acc, q) => acc + q.registros.length, 0);
  
  let ultimaEntrada = '-';
  if (totalEntries > 0) {
    let maxDate = '';
    quantities.forEach(q => {
      q.registros.forEach(r => {
        if (!maxDate || r.data_compra > maxDate) {
          maxDate = r.data_compra;
        }
      });
    });
    if (maxDate) {
      ultimaEntrada = format(new Date(maxDate + 'T00:00:00'), 'dd/MM/yyyy');
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
              <select
                value={filters.obra_id}
                onChange={e => setFilters({...filters, obra_id: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todas as Obras</option>
                {obras.map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={filters.categoria_id}
                onChange={e => {
                  setFilters({...filters, categoria_id: e.target.value, material_id: ''});
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todas as Categorias</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <select
                value={filters.material_id}
                onChange={e => setFilters({...filters, material_id: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todos os Materiais</option>
                {filteredMateriais.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filters.data_inicial}
                onChange={e => setFilters({...filters, data_inicial: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={filters.data_final}
                onChange={e => setFilters({...filters, data_final: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              CONSULTAR
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Resumo */}
      {filters.obra_id && !loading && quantities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Materiais Registrados</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueMaterials}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Registros de Entrada</p>
              <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última Entrada</p>
              <p className="text-2xl font-bold text-gray-900">{ultimaEntrada}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista / Tabela */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : quantities.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma entrada de material encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Desktop Table Header (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {!filters.obra_id && <div className="col-span-3">Obra</div>}
              <div className={!filters.obra_id ? "col-span-4" : "col-span-7"}>Material</div>
              <div className="col-span-2 text-center">Unidade</div>
              <div className="col-span-2 text-right">Qtd. Entradas</div>
              <div className="col-span-1"></div>
            </div>

            {quantities.map((row) => {
              const rowKey = `${row.obra_id}_${row.material_id}`;
              const isExpanded = expandedRow === rowKey;
              
              return (
                <div key={rowKey} className="flex flex-col">
                  {/* Row content */}
                  <div 
                    onClick={() => toggleRow(rowKey)}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : 'bg-white'}`}
                  >
                    {!filters.obra_id && (
                      <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 md:hidden" />
                        <span className="text-sm font-medium text-gray-900">{row.obra_nome}</span>
                      </div>
                    )}
                    
                    <div className={`col-span-1 ${!filters.obra_id ? "md:col-span-4" : "md:col-span-7"}`}>
                      <div className="text-sm font-bold text-gray-900">{row.material_nome}</div>
                      <div className="text-xs text-gray-500">{row.categoria_nome}</div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                      <span className="text-xs text-gray-500 uppercase md:hidden">Unidade:</span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">{row.unidade}</span>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                      <span className="text-xs text-gray-500 uppercase md:hidden">Total:</span>
                      <span className="text-base font-bold text-blue-700">{row.quantidade_total}</span>
                    </div>

                    <div className="hidden md:flex col-span-1 justify-end text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-b border-gray-200 p-4 md:p-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-900">{row.material_nome} <span className="text-gray-500 font-normal">({row.quantidade_total} {row.unidade})</span></h4>
                        <p className="text-xs text-gray-500 uppercase mt-1 tracking-wider">Histórico de Entradas na Obra: {row.obra_nome}</p>
                      </div>
                      
                      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {row.registros.sort((a,b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime()).map(reg => (
                              <tr key={reg.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(reg.data_compra + 'T00:00:00'), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                  {reg.fornecedor || '-'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  {reg.quantidade}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_unitario || 0)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_total || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
