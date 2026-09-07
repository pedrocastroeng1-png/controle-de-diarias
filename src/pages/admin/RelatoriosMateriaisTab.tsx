import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { apiMateriais } from '../../lib/api-materiais';
import { format, parseISO } from 'date-fns';
import { FileDown, FileText, Search, Loader2 } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RelatoriosMateriaisTab() {
  const [obras, setObras] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [dataInicial, setDataInicial] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [obraId, setObraId] = useState('todas');
  const [reportType, setReportType] = useState('COMPRAS'); // COMPRAS, ESTOQUE, MOVIMENTACOES, FINANCEIRO
  const [consolidado, setConsolidado] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [dataCompras, setDataCompras] = useState<any[]>([]);
  const [dataMovimentacoes, setDataMovimentacoes] = useState<any[]>([]);
  const [dataEstoque, setDataEstoque] = useState<any[]>([]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [obrasData, catData] = await Promise.all([
          api.getObras(),
          api.getMaterialCategories()
        ]);
        setObras(obrasData);
        setCategorias(catData);
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
  
  const selectedObraIsParent = useMemo(() => {
    if (obraId === 'todas') return false;
    return obras.some(o => o.id === obraId && !o.parent_obra_id);
  }, [obraId, obras]);

  const handleConsultar = async () => {
    setLoading(true);
    setError('');
    try {
      if (reportType === 'COMPRAS' || reportType === 'FINANCEIRO') {
        const compras = await apiMateriais.getRelatorioComprasMateriais({
          obraId: obraId === 'todas' ? undefined : obraId,
          startDate: dataInicial,
          endDate: dataFinal
        });
        setDataCompras(compras);
      } else if (reportType === 'MOVIMENTACOES') {
        // Movimentacoes view doesn't easily filter by date range in the API signature yet, but we will filter locally.
        const movs = await apiMateriais.getMovimentacoesMateriais({
          obraId: obraId === 'todas' ? undefined : obraId
        });
        const filteredMovs = movs.filter((m: any) => m.data_movimento >= dataInicial && m.data_movimento <= dataFinal);
        setDataMovimentacoes(filteredMovs);
      } else if (reportType === 'ESTOQUE') {
        if (selectedObraIsParent && consolidado) {
          const est = await apiMateriais.getEstoqueMateriaisConsolidado(obraId === 'todas' ? undefined : obraId);
          setDataEstoque(est);
        } else {
          const est = await apiMateriais.getEstoqueMateriais(obraId === 'todas' ? undefined : obraId);
          setDataEstoque(est);
        }
      }
    } catch (err: any) {
      setError('Erro ao gerar relatório: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getObraName = () => {
    if (obraId === 'todas') return 'Todas as Obras';
    return obras.find(o => o.id === obraId)?.nome || '';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `Relatório de Materiais - ${reportType}`;
    
    doc.setFontSize(18);
    doc.text('CONTROLE DE MATERIAIS', 14, 22);
    
    doc.setFontSize(12);
    doc.text(title, 14, 30);
    doc.text(`Obra: ${getObraName()}`, 14, 38);
    
    if (reportType !== 'ESTOQUE') {
      doc.text(`Período: ${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`, 14, 46);
    }
    
    let head = [[]] as any[];
    let body = [] as any[];

    if (reportType === 'COMPRAS') {
      head = [['Data', 'Obra', 'Fornecedor', 'Material', 'Qtd', 'Un', 'V. Unit.', 'V. Total']];
      body = dataCompras.map(c => [
        format(parseISO(c.data_compra), 'dd/MM/yyyy'),
        c.obra,
        c.fornecedor || '-',
        c.material,
        c.quantidade,
        c.unidade,
        formatCurrency(c.valor_unitario),
        formatCurrency(c.valor_total)
      ]);
    } else if (reportType === 'MOVIMENTACOES') {
      head = [['Data', 'Tipo', 'Material', 'Qtd', 'Un', 'Origem', 'Destino', 'Usuário']];
      body = dataMovimentacoes.map(m => [
        format(parseISO(m.data_movimento), 'dd/MM/yyyy'),
        m.tipo,
        m.material,
        m.quantidade,
        m.unidade,
        m.obra,
        m.obra_destino || '-',
        m.usuario_registro
      ]);
    } else if (reportType === 'ESTOQUE') {
      head = [['Obra', 'Material', 'Categoria', 'Entradas', 'Saídas', 'Saldo', 'Un']];
      body = dataEstoque.map(e => [
        e.obra || e.obra_principal,
        e.material,
        e.categoria,
        e.entradas,
        e.saidas,
        e.saldo,
        e.unidade
      ]);
    } else if (reportType === 'FINANCEIRO') {
      head = [['Obra', 'Material', 'Qtd Total', 'V. Unit. Médio', 'V. Total']];
      
      const agg = dataCompras.reduce((acc: any, curr) => {
        const key = `${curr.obra_id}_${curr.material_id}`;
        if (!acc[key]) acc[key] = { obra: curr.obra, material: curr.material, qtd: 0, total: 0 };
        acc[key].qtd += Number(curr.quantidade);
        acc[key].total += Number(curr.valor_total);
        return acc;
      }, {});
      
      body = Object.values(agg).map((a: any) => [
        a.obra,
        a.material,
        a.qtd,
        formatCurrency(a.qtd > 0 ? a.total / a.qtd : 0),
        formatCurrency(a.total)
      ]);
    }

    autoTable(doc, {
      startY: reportType === 'ESTOQUE' ? 50 : 54,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`relatorio_${reportType.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportType);

    if (reportType === 'COMPRAS') {
      sheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Obra', key: 'obra', width: 25 },
        { header: 'Fornecedor', key: 'fornecedor', width: 25 },
        { header: 'Material', key: 'material', width: 25 },
        { header: 'Categoria', key: 'categoria', width: 20 },
        { header: 'Quantidade', key: 'qtd', width: 15 },
        { header: 'Unidade', key: 'un', width: 10 },
        { header: 'Valor Unit.', key: 'vunit', width: 15 },
        { header: 'Valor Total', key: 'vtotal', width: 15 }
      ];
      dataCompras.forEach(c => {
        sheet.addRow({
          data: format(parseISO(c.data_compra), 'dd/MM/yyyy'),
          obra: c.obra,
          fornecedor: c.fornecedor,
          material: c.material,
          categoria: c.categoria,
          qtd: c.quantidade,
          un: c.unidade,
          vunit: c.valor_unitario,
          vtotal: c.valor_total
        });
      });
    } else if (reportType === 'ESTOQUE') {
      sheet.columns = [
        { header: 'Obra', key: 'obra', width: 25 },
        { header: 'Material', key: 'material', width: 25 },
        { header: 'Categoria', key: 'categoria', width: 20 },
        { header: 'Entradas', key: 'entradas', width: 15 },
        { header: 'Saídas', key: 'saidas', width: 15 },
        { header: 'Saldo', key: 'saldo', width: 15 },
        { header: 'Unidade', key: 'un', width: 10 }
      ];
      dataEstoque.forEach(e => {
        sheet.addRow({
          obra: e.obra || e.obra_principal,
          material: e.material,
          categoria: e.categoria,
          entradas: e.entradas,
          saidas: e.saidas,
          saldo: e.saldo,
          un: e.unidade
        });
      });
    } else if (reportType === 'MOVIMENTACOES') {
      sheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Material', key: 'material', width: 25 },
        { header: 'Qtd', key: 'qtd', width: 15 },
        { header: 'Un', key: 'un', width: 10 },
        { header: 'Obra Origem', key: 'origem', width: 25 },
        { header: 'Obra Destino', key: 'destino', width: 25 },
        { header: 'Usuário', key: 'usuario', width: 20 },
        { header: 'Motivo', key: 'motivo', width: 30 }
      ];
      dataMovimentacoes.forEach(m => {
        sheet.addRow({
          data: format(parseISO(m.data_movimento), 'dd/MM/yyyy'),
          tipo: m.tipo,
          material: m.material,
          qtd: m.quantidade,
          un: m.unidade,
          origem: m.obra,
          destino: m.obra_destino,
          usuario: m.usuario_registro,
          motivo: m.motivo
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `controle_materiais_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Filtros do Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="COMPRAS">Compras Detalhadas</option>
              <option value="ESTOQUE">Posição de Estoque</option>
              <option value="MOVIMENTACOES">Histórico de Movimentações</option>
              <option value="FINANCEIRO">Financeiro Consolidado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
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

          {reportType !== 'ESTOQUE' && (
            <>
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
            </>
          )}
        </div>
        
        {reportType === 'ESTOQUE' && selectedObraIsParent && (
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="consolidado"
              checked={consolidado}
              onChange={(e) => setConsolidado(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consolidado" className="text-sm font-medium text-gray-700">Relatório consolidado para obra principal</label>
          </div>
        )}

        <div className="pt-4 flex flex-wrap gap-4 border-t border-gray-100">
          <button 
            onClick={handleConsultar}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Consultar
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 shadow-sm"
          >
            <FileDown className="w-5 h-5" />
            Exportar Excel
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>
      
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {/* RESULTADOS DA CONSULTA */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        
        {reportType === 'COMPRAS' && (
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
                {dataCompras.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Faça uma consulta para visualizar os dados.</td></tr> : 
                  dataCompras.map(c => (
                    <tr key={c.item_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{format(parseISO(c.data_compra), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-sm">{c.obra}</td>
                      <td className="px-4 py-3 text-sm">{c.fornecedor || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{c.material}</td>
                      <td className="px-4 py-3 text-sm text-right">{c.quantidade} {c.unidade}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(c.valor_total)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'FINANCEIRO' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">V. Unit. Médio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataCompras.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Faça uma consulta para visualizar os dados.</td></tr> : 
                  Object.values(dataCompras.reduce((acc: any, curr) => {
                    const key = `${curr.obra_id}_${curr.material_id}`;
                    if (!acc[key]) acc[key] = { obra: curr.obra, material: curr.material, qtd: 0, total: 0 };
                    acc[key].qtd += Number(curr.quantidade);
                    acc[key].total += Number(curr.valor_total);
                    return acc;
                  }, {})).map((a: any, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{a.obra}</td>
                      <td className="px-4 py-3 text-sm font-medium">{a.material}</td>
                      <td className="px-4 py-3 text-sm text-right">{a.qtd}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(a.qtd > 0 ? a.total / a.qtd : 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(a.total)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'ESTOQUE' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entradas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saídas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataEstoque.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Faça uma consulta para visualizar os dados.</td></tr> : 
                  dataEstoque.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{e.obra || e.obra_principal}</td>
                      <td className="px-4 py-3 text-sm font-medium">{e.material}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">{e.entradas}</td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">{e.saidas}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{e.saldo} {e.unidade}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'MOVIMENTACOES' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataMovimentacoes.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Faça uma consulta para visualizar os dados.</td></tr> : 
                  dataMovimentacoes.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{format(parseISO(m.data_movimento), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-sm">{m.tipo}</td>
                      <td className="px-4 py-3 text-sm font-medium">{m.material}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{m.quantidade} {m.unidade}</td>
                      <td className="px-4 py-3 text-sm">{m.obra}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
