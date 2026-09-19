import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { Funcionario, Obra, Funcao } from '../../lib/types';
import { Loader2, Users, Briefcase, ChevronRight } from 'lucide-react';

export default function QuadroAtual() {
  
  // ==========================================
  // ESTADO - QUADRO ATUAL
  // ==========================================
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [funcData, obrasData, funcoesData] = await Promise.all([
        api.getFuncionarios('todos'),
        api.getObras(),
        api.getFuncoes()
      ]);
      
      const allFuncs = funcData.sort((a, b) => a.nome.localeCompare(b.nome));

      setFuncionarios(allFuncs);
      setObras(obrasData);
      setFuncoes(funcoesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LOGIC - QUADRO ATUAL
  // ==========================================
  const hierarchy = useMemo(() => {
    const principalObras = obras.filter(o => !o.parent_obra_id);
    return principalObras.map(principal => {
      const subobras = obras.filter(o => o.parent_obra_id === principal.id);
      
      // Calculate consolidated employees
      const subObrasIds = subobras.map(so => so.id);
      const allObraIds = [principal.id, ...subObrasIds];
      const employeesInTree = funcionarios.filter(f => f.ativo && allObraIds.includes(f.obra_id));
      
      const fnCount = employeesInTree.reduce((acc, emp) => {
        const funcao = funcoes.find(fn => fn.id === emp.funcao_id);
        const fnName = funcao ? funcao.nome : 'Sem Função';
        acc[fnName] = (acc[fnName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...principal,
        subobras: subobras.map(sub => {
          const emps = funcionarios.filter(f => f.ativo && f.obra_id === sub.id);
          const sFnCount = emps.reduce((acc, emp) => {
            const funcao = funcoes.find(fn => fn.id === emp.funcao_id);
            const fnName = funcao ? funcao.nome : 'Sem Função';
            acc[fnName] = (acc[fnName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return {
            ...sub,
            total: emps.length,
            funcoesCount: sFnCount
          };
        }),
        total: employeesInTree.length,
        funcoesCount: fnCount
      };
    });
  }, [obras, funcionarios, funcoes]);

  const selectedObra = selectedObraId ? hierarchy.find(h => h.id === selectedObraId) : null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quadro Atual</h1>
        <p className="text-gray-500 text-sm mt-1">Visão em tempo real da equipe por obra e função</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {!selectedObra ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hierarchy.map(obra => (
                <div key={obra.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-slate-800 p-4 text-white">
                    <h3 className="font-bold text-lg truncate">{obra.nome}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{obra.total} funcionários</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumo por Função</h4>
                    <div className="space-y-2">
                      {Object.entries(obra.funcoesCount).map(([funcao, count]) => (
                        <div key={funcao} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{funcao}</span>
                          <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-900">{count}</span>
                        </div>
                      ))}
                      {Object.keys(obra.funcoesCount).length === 0 && (
                        <p className="text-sm text-gray-400 italic">Nenhum funcionário ativo.</p>
                      )}
                    </div>
                  </div>
                  {obra.subobras.length > 0 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedObraId(obra.id)}
                        className="w-full flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <span>Ver {obra.subobras.length} Subobras</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {hierarchy.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                  Nenhuma obra cadastrada.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">
                <div>
                  <button
                    onClick={() => setSelectedObraId(null)}
                    className="text-slate-300 hover:text-white flex items-center gap-1 text-sm font-medium mb-3 transition-colors"
                  >
                    ← Voltar para Obras
                  </button>
                  <h2 className="text-2xl font-bold">{selectedObra.nome}</h2>
                  <div className="flex items-center gap-2 mt-2 text-slate-300">
                    <Users className="w-5 h-5" />
                    <span className="font-medium text-lg">Total Consolidado: {selectedObra.total} funcionários</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg min-w-[250px]">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Total por Função (Consolidado)</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(selectedObra.funcoesCount).map(([funcao, count]) => (
                      <div key={funcao} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300 truncate pr-2">{funcao}</span>
                        <span className="font-semibold text-white bg-slate-600 px-2 py-0.5 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  Subobras ({selectedObra.subobras.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedObra.subobras.map(sub => (
                    <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{sub.nome}</h4>
                      <p className="text-sm font-medium text-blue-600 mb-4">{sub.total} funcionários</p>
                      
                      <div className="space-y-2">
                        {Object.entries(sub.funcoesCount).map(([funcao, count]) => (
                          <div key={funcao} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-600">{funcao}</span>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                          </div>
                        ))}
                        {Object.keys(sub.funcoesCount).length === 0 && (
                          <p className="text-sm text-gray-400 italic">Sem funcionários alocados</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
