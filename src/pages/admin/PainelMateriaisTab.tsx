import React, { useState, useEffect } from 'react';
import { apiMateriais } from '../../lib/api-materiais';
import { Loader2, DollarSign, ListOrdered, HardHat, Store, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PainelMateriaisTab() {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiMateriais.getRelatorioComprasMateriais();
        setCompras(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;
  }

  const totalComprado = compras.reduce((acc, c) => acc + Number(c.valor_total || 0), 0);
  const totalLancamentos = compras.length;
  const obrasUnicas = new Set(compras.map(c => c.obra)).size;
  const fornecedoresUnicos = new Set(compras.map(c => c.fornecedor).filter(Boolean)).size;
  const quantidadeTotal = compras.reduce((acc, c) => acc + Number(c.quantidade || 0), 0);

  // Agrupamentos
  const porObraMap = compras.reduce((acc: any, c) => {
    if (!acc[c.obra]) acc[c.obra] = { obra: c.obra, valor: 0, qtdLancamentos: 0, qtdMaterial: 0 };
    acc[c.obra].valor += Number(c.valor_total || 0);
    acc[c.obra].qtdLancamentos += 1;
    acc[c.obra].qtdMaterial += Number(c.quantidade || 0);
    return acc;
  }, {});
  const valorPorObra = Object.values(porObraMap).sort((a: any, b: any) => b.valor - a.valor);

  const porCategoriaMap = compras.reduce((acc: any, c) => {
    if (!acc[c.categoria]) acc[c.categoria] = { categoria: c.categoria, valor: 0, qtd: 0 };
    acc[c.categoria].valor += Number(c.valor_total || 0);
    acc[c.categoria].qtd += Number(c.quantidade || 0);
    return acc;
  }, {});
  const valorPorCategoria = Object.values(porCategoriaMap).sort((a: any, b: any) => b.valor - a.valor);

  const COLORS = ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-700" /></div>
            <span className="text-sm font-bold tracking-wider">TOTAL COMPRADO</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{formatCurrency(totalComprado)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><ListOrdered className="w-5 h-5 text-indigo-700" /></div>
            <span className="text-sm font-bold tracking-wider">LANÇAMENTOS</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{totalLancamentos}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-700" /></div>
            <span className="text-sm font-bold tracking-wider">QTD MATERIAIS</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{quantidadeTotal.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg"><HardHat className="w-5 h-5 text-orange-700" /></div>
            <span className="text-sm font-bold tracking-wider">OBRAS ATENDIDAS</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{obrasUnicas}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><Store className="w-5 h-5 text-emerald-700" /></div>
            <span className="text-sm font-bold tracking-wider">FORNECEDORES</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{fornecedoresUnicos}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">VALOR DE MATERIAIS DESTINADOS POR OBRA</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valorPorObra.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={(val) => `R$ ${val/1000}k`} />
                <YAxis type="category" dataKey="obra" width={150} tick={{fontSize: 12, fill: '#4B5563'}} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {valorPorObra.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">VALOR POR CATEGORIA</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valorPorCategoria.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={(val) => `R$ ${val/1000}k`} />
                <YAxis type="category" dataKey="categoria" width={150} tick={{fontSize: 12, fill: '#4B5563'}} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {valorPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">MATERIAIS DESTINADOS POR OBRA (RESUMO)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Obra</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qtd Lançamentos</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qtd Total de Materiais</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {valorPorObra.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.obra}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.qtdLancamentos}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.qtdMaterial.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">{formatCurrency(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
