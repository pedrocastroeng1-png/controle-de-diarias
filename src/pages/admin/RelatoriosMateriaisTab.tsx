import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { apiMateriais } from '../../lib/api-materiais';
import { format, parseISO } from 'date-fns';
import { FileDown, FileText, Search, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gerarPlanilhaGerencial } from '../../lib/excel/geradorPlanilhaMateriais';

export default function RelatoriosMateriaisTab() {
  const [obras, setObras] = useState<any[]>([]);
  
  const [dataInicial, setDataInicial] = useState(format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [obraId, setObraId] = useState('todas');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [dataCompras, setDataCompras] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadFilters() {
      try {
        const obrasData = await api.getObras();
        setObras(obrasData);
      } catch (err) {
        console.error(err);
      }
    }
    loadFilters();
  }, []);

  const hierarchy = useMemo(() => {
    const principais = obras.filter(o => !o.parent_obra_id);
    return principais.map(p => ({
      ...p,
      subobras: obras.filter(o => o.parent_obra_id === p.id)
    }));
  }, [obras]);

  const handleConsultar = async () => {
    setLoading(true);
    setError('');
    try {
      const compras = await apiMateriais.getRelatorioComprasMateriais({
        obraId: obraId === 'todas' ? undefined : obraId,
        startDate: dataInicial,
        endDate: dataFinal
      });
      setDataCompras(compras);
    } catch (err: any) {
      setError('Erro ao gerar relatório: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // Se não houver dados buscados, busca todos
      let dados = dataCompras;
      if (dados.length === 0) {
        dados = await apiMateriais.getRelatorioComprasMateriais({
          obraId: obraId === 'todas' ? undefined : obraId,
          startDate: dataInicial,
          endDate: dataFinal
        });
      }
      await gerarPlanilhaGerencial(dados);
    } catch (err: any) {
      setError('Erro ao gerar Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-2">Exportação e Relatórios</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Obra (Opcional)</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Período Inicial</label>
            <input 
              type="date"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período Final</label>
            <input 
              type="date"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4">
          <button 
            onClick={handleConsultar}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Pré-visualizar Entradas
          </button>
          
          <button 
            onClick={handleExportExcel}
            disabled={loading}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 flex items-center gap-3 shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
          >
            <FileDown className="w-6 h-6" />
            BAIXAR PLANILHA GERENCIAL (EXCEL)
          </button>
        </div>
      </div>
      
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg font-medium">{error}</div>}

      {/* RESULTADOS DA CONSULTA */}
      {dataCompras.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
          <h4 className="font-bold text-gray-700 mb-4">Pré-visualização ({dataCompras.length} registros encontrados)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataCompras.slice(0, 50).map(c => (
                  <tr key={c.item_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{format(parseISO(c.data_compra), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-sm">{c.obra}</td>
                    <td className="px-4 py-3 text-sm">{c.fornecedor || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{c.material}</td>
                    <td className="px-4 py-3 text-sm text-right">{c.quantidade} {c.unidade}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(c.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dataCompras.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                Exibindo apenas os 50 primeiros registros. Baixe a planilha para ver todos.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
