import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../lib/api';
import { Ferramenta } from '../../../lib/types';
import { PenTool, Wrench, AlertTriangle, AlertCircle, XCircle, CheckCircle, Users, HardHat, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<any[]>([]);
  const [todosEmprestimos, setTodosEmprestimos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [fer, empAtivos, empTodos] = await Promise.all([
          api.getFerramentas(),
          api.getEmprestimosAtivos(),
          api.getTodosEmprestimos()
        ]);
        setFerramentas(fer);
        setEmprestimosAtivos(empAtivos);
        setTodosEmprestimos(empTodos);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = ferramentas.length;
    const countByStatus = {
      ATIVA: 0,
      EMPRESTADA: 0,
      QUEBRADA: 0,
      EM_REPARO: 0,
      PERDIDA: 0,
      INATIVA: 0
    };
    ferramentas.forEach(f => {
      if (countByStatus[f.status] !== undefined) {
        countByStatus[f.status]++;
      }
    });

    const funcsUnicos = new Set(emprestimosAtivos.map(e => e.funcionario_id)).size;
    const ferramentasEmprestadas = emprestimosAtivos.length;

    // Ferramentas mais emprestadas
    const counts: Record<string, { count: number, name: string }> = {};
    todosEmprestimos.forEach(e => {
      if (!counts[e.ferramenta_id]) {
        counts[e.ferramenta_id] = { count: 0, name: e.ferramenta?.nome || 'Desconhecida' };
      }
      counts[e.ferramenta_id].count++;
    });
    const maisEmprestadas = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Funcionarios com mais ferramentas
    const funcCounts: Record<string, { count: number, name: string }> = {};
    emprestimosAtivos.forEach(e => {
      if (!funcCounts[e.funcionario_id]) {
        funcCounts[e.funcionario_id] = { count: 0, name: e.funcionario?.nome || 'Desconhecido' };
      }
      funcCounts[e.funcionario_id].count++;
    });
    const topFuncs = Object.values(funcCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Obras com mais ferramentas
    const obraCounts: Record<string, { count: number, name: string }> = {};
    emprestimosAtivos.forEach(e => {
      const oId = e.obra_id || 'unknown';
      if (!obraCounts[oId]) {
        obraCounts[oId] = { count: 0, name: e.obra?.nome || 'Desconhecida' };
      }
      obraCounts[oId].count++;
    });
    const topObras = Object.values(obraCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      total,
      countByStatus,
      funcsUnicos,
      ferramentasEmprestadas,
      maisEmprestadas,
      topFuncs,
      topObras
    };
  }, [ferramentas, emprestimosAtivos, todosEmprestimos]);

  if (loading) return <div className="p-4 text-gray-500">Carregando dashboard...</div>;

  const COLORS = {
    ATIVA: '#10B981', // green
    EMPRESTADA: '#3B82F6', // blue
    QUEBRADA: '#EF4444', // red
    EM_REPARO: '#F59E0B', // yellow
    PERDIDA: '#6B7280', // gray
    INATIVA: '#9CA3AF' // light gray
  };

  const statusData = Object.entries(stats.countByStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Total de Ferramentas</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <div className="p-2 bg-gray-50 text-gray-600 rounded-lg"><PenTool className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Funcionários c/ Ferramentas</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{stats.funcsUnicos}</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Aguardando Reparo (Quebradas)</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{stats.countByStatus.QUEBRADA}</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Em Manutenção</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{stats.countByStatus.EM_REPARO}</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Wrench className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(stats.countByStatus).map(([status, count]) => (
          <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">{status.replace('_', ' ')}</p>
            <p className="text-xl font-semibold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Ferramentas por Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.replace(' ', '_') as keyof typeof COLORS] || '#000'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Obras com Mais Ferramentas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topObras} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Funcionários com Mais Ferramentas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topFuncs} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Ferramentas Mais Emprestadas (Histórico)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.maisEmprestadas} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
