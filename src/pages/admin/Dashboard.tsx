import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Funcionario, Obra, Funcao, Presenca } from '../../lib/types';
import { HardHat, Users, CheckCircle, XCircle, AlertTriangle, Info, ChevronRight, Activity, ArrowLeft, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParentObraId, setSelectedParentObraId] = useState<string | null>(null);

  const hoje = new Date();
  const dataStr = format(hoje, 'yyyy-MM-dd');
  const hojeFormatado = format(hoje, "dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    let channel: any;

    async function loadData() {
      try {
        setIsLoading(true);
        const [obrasData, funcoesData, funcionariosData, presencasData] = await Promise.all([
          api.getObras(),
          api.getFuncoes(),
          api.getFuncionarios('todos', false),
          api.getPresencas(dataStr)
        ]);

        setObras(obrasData);
        setFuncoes(funcoesData);
        setFuncionarios(funcionariosData);
        setPresencas(presencasData);

        // Se houver apenas 1 obra principal ativa, auto-seleciona ela.
        const parentObras = obrasData.filter(o => !o.parent_obra_id && o.ativo !== false);
        if (parentObras.length === 1) {
          setSelectedParentObraId(parentObras[0].id);
        }

        // Setup realtime subscription for presencas
        if (supabase) {
          channel = supabase.channel('public:presencas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas', filter: `data=eq.${dataStr}` }, () => {
              // Reload presencas on any change
              api.getPresencas(dataStr).then(setPresencas).catch(console.error);
            })
            .subscribe();
        }

      } catch (error) {
        setErro('Ocorreu um erro ao carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();

    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [dataStr]);

  // Filtra funcionários válidos para "hoje"
  const validFuncionarios = useMemo(() => {
    return funcionarios.filter(f => {
      if (f.data_admissao && f.data_admissao > dataStr) return false;
      if (f.ativo === false) {
        if (f.data_desligamento && dataStr > f.data_desligamento) return false;
        if (!f.data_desligamento) return false;
      }
      return true;
    });
  }, [funcionarios, dataStr]);

  // Função para normalizar nome da função (Pedreiro de acabamento -> Pedreiro)
  const getFuncaoBase = (fnName: string) => {
    const name = fnName.toUpperCase();
    if (name.includes('PEDREIRO')) return 'PEDREIRO';
    if (name.includes('SERVENTE') || name.includes('AJUDANTE')) return 'SERVENTE';
    if (name.includes('APONTADOR')) return 'APONTADOR';
    return 'OUTROS';
  };

  // Helper para analisar a composição de uma lista de funcionários e suas presenças
  const analyzeComposition = (emps: Funcionario[], pres: Presenca[]) => {
    const presentes = emps.filter(e => pres.some(p => p.funcionario_id === e.id && (p.presente === true || (p as any).status === 'PRESENTE' || (p as any).status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA')));
    const faltas = emps.length - presentes.length;
    
    let pedreiros = 0;
    let serventes = 0;
    let apontadores = 0;
    let outros = 0;
    let diaristasPresentes = 0;
    let custoDiarias = 0;

    presentes.forEach(emp => {
      const fn = funcoes.find(f => f.id === emp.funcao_id);
      const baseFn = getFuncaoBase(fn?.nome || '');
      if (baseFn === 'PEDREIRO') pedreiros++;
      else if (baseFn === 'SERVENTE') serventes++;
      else if (baseFn === 'APONTADOR') apontadores++;
      else outros++;
      
      if (emp.tipo_colaborador !== 'CLT') {
        diaristasPresentes++;
        
        const pRecord = pres.find(p => p.funcionario_id === emp.id && (p.presente === true || (p as any).status === 'PRESENTE' || (p as any).status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA'));
        if (pRecord) {
            let valor = fn?.valor_diaria || 0;
            if (pRecord.tipo_diaria === 'MEIA_DIARIA' || (pRecord as any).status === 'MEIA_DIARIA') valor = valor / 2;
            if ((pRecord as any).percentual_diaria) valor = valor * ((pRecord as any).percentual_diaria / 100);
            
            custoDiarias += valor;
        }
      }
    });

    const relacao = pedreiros > 0 ? (serventes / pedreiros) : null;
    const serventesRecomendados = pedreiros * 2;
    const excesso = serventes > serventesRecomendados ? serventes - serventesRecomendados : 0;

    let alertState: 'NORMAL' | 'ATENCAO' | 'ALERTA' | 'NO_PEDREIROS' = 'NORMAL';
    if (pedreiros === 0 && serventes > 0) alertState = 'NO_PEDREIROS';
    else if (relacao !== null && relacao > 3) alertState = 'ALERTA';
    else if (relacao !== null && relacao > 2) alertState = 'ATENCAO';

    return {
      total: emps.length,
      presentesCount: presentes.length,
      faltas,
      pedreiros,
      serventes,
      apontadores,
      outros,
      relacao,
      serventesRecomendados,
      excesso,
      alertState,
      diaristasPresentes,
      custoDiarias
    };
  };

  // Build hierarchy and stats
  const hierarchy = useMemo(() => {
    const parentObras = obras.filter(o => !o.parent_obra_id && o.ativo !== false);
    return parentObras.map(po => {
      const sub = obras.filter(o => o.parent_obra_id === po.id && o.ativo !== false);
      const allIds = [po.id, ...sub.map(s => s.id)];
      const emps = validFuncionarios.filter(f => allIds.includes(f.obra_id));
      const comp = analyzeComposition(emps, presencas);

      return {
        ...po,
        subobrasCount: sub.length,
        subobras: sub.map(s => {
          const sEmps = validFuncionarios.filter(f => f.obra_id === s.id);
          return {
            ...s,
            comp: analyzeComposition(sEmps, presencas)
          };
        }),
        comp
      };
    });
  }, [obras, validFuncionarios, presencas, funcoes]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando Central de Operações...</div>;
  }
  
  if (erro) {
    return <div className="p-8 text-center text-red-500">{erro}</div>;
  }

  const renderAlert = (comp: any, obraNome: string) => {
    if (comp.alertState === 'NO_PEDREIROS') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">🚨 ERRO DE COMPOSIÇÃO: {obraNome}</h4>
            <p className="text-sm text-red-700 mt-1">
              Existem <strong>{comp.serventes}</strong> serventes presentes, mas nenhum pedreiro registrado como presente. Relação NÃO DISPONÍVEL.
            </p>
          </div>
        </div>
      );
    }
    
    if (comp.alertState === 'ALERTA') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">🚨 ALERTA DE COMPOSIÇÃO: {obraNome}</h4>
            <p className="text-sm text-red-700 mt-1">
              <strong>{comp.serventes}</strong> serventes para <strong>{comp.pedreiros}</strong> pedreiros. A quantidade está muito acima da referência.
            </p>
            <div className="mt-2 text-xs font-medium text-red-800 bg-red-100 inline-block px-2 py-1 rounded">
              Referência: {comp.serventesRecomendados} | Excesso: {comp.excesso} | Relação atual: {comp.relacao?.toFixed(2)} serv/ped.
            </div>
          </div>
        </div>
      );
    }

    if (comp.alertState === 'ATENCAO') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-yellow-800 text-sm">⚠️ ATENÇÃO: {obraNome}</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Quantidade de serventes ({comp.serventes}) acima da referência operacional. Relação: {comp.relacao?.toFixed(2)} serv/ped.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Se não tem parent obra selecionada
  if (!selectedParentObraId) {
    const totalComp = analyzeComposition(validFuncionarios, presencas);
    
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Operações</h1>
            <p className="text-gray-500 mt-1">Visão Geral da Empresa • Hoje é {hojeFormatado}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
             <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Total Global</h2>
             <div className="text-4xl font-bold">{totalComp.total}</div>
             <p className="text-slate-400 text-sm mt-1">Funcionários no quadro</p>
          </div>
          <div className="bg-green-600 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
             <h2 className="text-sm font-semibold text-green-100 uppercase tracking-wider mb-2">Presentes Hoje</h2>
             <div className="text-4xl font-bold">{totalComp.presentesCount}</div>
             <p className="text-green-100 text-sm mt-1">Taxa de presença: {totalComp.total > 0 ? Math.round((totalComp.presentesCount/totalComp.total)*100) : 0}%</p>
          </div>
          <div className="bg-red-50 border border-red-100 text-red-900 rounded-xl p-6 shadow-sm flex flex-col justify-between">
             <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">Faltas Hoje</h2>
             <div className="text-4xl font-bold">{totalComp.faltas}</div>
             <p className="text-red-600 text-sm mt-1">Funcionários não registrados</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-6 shadow-sm flex flex-col justify-between">
             <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Custo de Diárias</h2>
             <div className="text-3xl font-bold">{formatCurrency(totalComp.custoDiarias)}</div>
             <p className="text-amber-700 text-xs mt-2 font-medium bg-amber-100/50 p-1.5 rounded inline-block">Refere-se a {totalComp.diaristasPresentes} diaristas</p>
          </div>
        </div>
        
        {/* Render alert from company level if any */}
        {renderAlert(totalComp, "VISÃO GLOBAL DA EMPRESA")}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-gray-500" />
              Obras em Execução ({hierarchy.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {hierarchy.map(po => (
              <div key={po.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{po.nome}</h4>
                  <p className="text-sm text-gray-500 mt-1">{po.subobrasCount} frentes de trabalho ativas</p>
                  
                  <div className="flex gap-4 mt-4">
                    <div className="bg-gray-100 px-3 py-1.5 rounded-md">
                      <span className="text-xs text-gray-500 block">Quadro</span>
                      <span className="font-bold text-gray-900">{po.comp.total}</span>
                    </div>
                    <div className="bg-green-50 text-green-800 px-3 py-1.5 rounded-md border border-green-100">
                      <span className="text-xs block">Presentes</span>
                      <span className="font-bold">{po.comp.presentesCount}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 max-w-md">
                   {renderAlert(po.comp, po.nome) || (
                     <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-start gap-2">
                       <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                       <span className="text-green-800 font-medium">Composição Equilibrada ({po.comp.relacao?.toFixed(2)} serv/ped)</span>
                     </div>
                   )}
                </div>
                
                <button
                  onClick={() => setSelectedParentObraId(po.id)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 flex-shrink-0"
                >
                  Visão por Obra
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            {hierarchy.length === 0 && (
              <div className="p-8 text-center text-gray-500">Nenhuma obra cadastrada.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Visão da Obra Principal Selecionada
  const activeObra = hierarchy.find(o => o.id === selectedParentObraId);
  if (!activeObra) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 lg:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedParentObraId(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">CENTRAL DE OPERAÇÕES</h1>
            <p className="text-gray-500 mt-1">Hoje é {hojeFormatado}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 ml-[52px] sm:ml-0">
          <div className="bg-amber-100 p-2 rounded-full hidden sm:block">
            <DollarSign className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Diárias de Hoje</p>
            <p className="text-xl font-bold text-amber-900 leading-none">{formatCurrency(activeObra.comp.custoDiarias)}</p>
          </div>
        </div>
      </div>
      
      {/* OBRA / GRUPO ATIVO */}
      <div className="bg-blue-900 text-white p-6 rounded-xl shadow-sm">
         <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-1">Obra / Grupo Ativo</p>
              <h2 className="text-3xl font-bold">{activeObra.nome}</h2>
              <p className="text-blue-100 mt-1">{activeObra.subobrasCount} frentes de trabalho</p>
            </div>
            <Activity className="w-12 h-12 text-blue-400 opacity-50 hidden sm:block" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* QUADRO DE HOJE */}
         <div className="col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Quadro de Hoje</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Total no Quadro</span>
                   <span className="font-bold text-xl">{activeObra.comp.total}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Presentes</span>
                   <span className="font-bold text-xl text-green-600">{activeObra.comp.presentesCount}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Faltas</span>
                   <span className="font-bold text-xl text-red-600">{activeObra.comp.faltas}</span>
                 </div>
               </div>
            </div>
            <div className="mt-6 pt-4 border-t">
               <span className="text-sm text-gray-500 block">Taxa de Presença</span>
               <span className="text-2xl font-bold text-gray-900">{activeObra.comp.total > 0 ? Math.round((activeObra.comp.presentesCount/activeObra.comp.total)*100) : 0}%</span>
            </div>
         </div>

         {/* COMPOSIÇÃO DOS PRESENTES */}
         <div className="col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Composição dos Presentes</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="text-gray-700 font-medium">👷 Pedreiros</span>
                 <span className="font-bold text-lg">{activeObra.comp.pedreiros}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="text-gray-700 font-medium">🪣 Serventes</span>
                 <span className="font-bold text-lg">{activeObra.comp.serventes}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="text-gray-700 font-medium">📋 Apontadores</span>
                 <span className="font-bold text-lg">{activeObra.comp.apontadores}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="text-gray-700 font-medium">🔧 Outras Funções</span>
                 <span className="font-bold text-lg">{activeObra.comp.outros}</span>
               </div>
            </div>
         </div>

         {/* RELAÇÃO SERVENTE / PEDREIRO */}
         <div className="col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Relação Serv/Pedr</h3>
              {activeObra.comp.pedreiros === 0 && activeObra.comp.serventes > 0 ? (
                <div className="text-center py-4">
                  <span className="text-3xl font-bold text-red-600 block">N/D</span>
                  <span className="text-sm text-gray-500">Sem pedreiros</span>
                </div>
              ) : activeObra.comp.pedreiros === 0 ? (
                <div className="text-center py-4">
                  <span className="text-3xl font-bold text-gray-400 block">-</span>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="text-sm text-gray-500 block mb-1">{activeObra.comp.serventes} ÷ {activeObra.comp.pedreiros} =</span>
                  <span className="text-4xl font-bold text-gray-900">{activeObra.comp.relacao?.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4">
               {activeObra.comp.alertState === 'NORMAL' && (
                 <div className="bg-green-100 text-green-800 text-center py-2 rounded-lg font-bold text-sm">
                   🟢 EQUILIBRADO
                 </div>
               )}
               {activeObra.comp.alertState === 'ATENCAO' && (
                 <div className="bg-yellow-100 text-yellow-800 text-center py-2 rounded-lg font-bold text-sm">
                   🟡 ATENÇÃO
                 </div>
               )}
               {activeObra.comp.alertState === 'ALERTA' && (
                 <div className="bg-red-100 text-red-800 text-center py-2 rounded-lg font-bold text-sm">
                   🔴 EXCESSO DE SERVENTES
                 </div>
               )}
               {activeObra.comp.alertState === 'NO_PEDREIROS' && (
                 <div className="bg-red-100 text-red-800 text-center py-2 rounded-lg font-bold text-sm">
                   🔴 ERRO DE COMPOSIÇÃO
                 </div>
               )}
               <p className="text-xs text-center text-gray-500 mt-2">Referência: até 2 serventes / 1 pedreiro</p>
            </div>
         </div>

         {/* ALERTAS OPERACIONAIS */}
         <div className="col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm h-full flex flex-col">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-3">Alertas Operacionais</h3>
              <div className="flex-1 overflow-y-auto">
                {activeObra.comp.alertState === 'NORMAL' ? (
                  <div className="text-sm text-gray-500 italic py-2">Nenhum alerta para este grupo. Composição operacional equilibrada.</div>
                ) : (
                  renderAlert(activeObra.comp, activeObra.nome)
                )}
              </div>
            </div>
         </div>
      </div>

      {/* VISÃO POR OBRA (SUBOBRAS E A PROPRIA OBRA) */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Visão por Obra</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Incluir a própria obra principal caso existam funcionários atrelados diretamente nela */}
           {[activeObra, ...activeObra.subobras].filter(o => o.comp.total > 0).map(sub => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-lg text-gray-900 truncate" title={sub.nome}>{sub.nome}</h4>
                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-600">Funcionários:</div>
                  <div className="font-medium text-right">{sub.comp.total}</div>
                  
                  <div className="text-gray-600">Presentes:</div>
                  <div className="font-medium text-right text-green-600">{sub.comp.presentesCount}</div>
                  
                  <div className="text-gray-600">Pedreiros:</div>
                  <div className="font-medium text-right">{sub.comp.pedreiros}</div>
                  
                  <div className="text-gray-600">Serventes:</div>
                  <div className="font-medium text-right">{sub.comp.serventes}</div>
                  
                  <div className="text-gray-600">Relação:</div>
                  <div className="font-medium text-right">
                    {sub.comp.pedreiros === 0 && sub.comp.serventes > 0 ? 'N/D' : sub.comp.pedreiros === 0 ? '-' : `${sub.comp.relacao?.toFixed(2)} serv/ped`}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  {sub.comp.alertState === 'NORMAL' && (
                    <div className="text-green-700 font-bold text-sm flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 🟢 NORMAL
                    </div>
                  )}
                  {sub.comp.alertState === 'ATENCAO' && (
                    <div className="text-yellow-700 font-bold text-sm flex items-center justify-center gap-1">
                      <Info className="w-4 h-4" /> 🟡 ATENÇÃO
                    </div>
                  )}
                  {sub.comp.alertState === 'ALERTA' && (
                    <div className="text-red-700 font-bold text-sm flex items-center justify-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> 🔴 ALERTA
                    </div>
                  )}
                  {sub.comp.alertState === 'NO_PEDREIROS' && (
                    <div className="text-red-700 font-bold text-sm flex items-center justify-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> 🔴 SEM PEDREIROS
                    </div>
                  )}
                </div>
              </div>
           ))}
           {[activeObra, ...activeObra.subobras].filter(o => o.comp.total > 0).length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-xl">
                Nenhuma frente de trabalho ativa com funcionários vinculados.
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
