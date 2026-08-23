import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { HardHat, Users, CheckCircle, XCircle, Activity, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PushDiagnostic } from '../../components/PushDiagnostic';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [totalObras, setTotalObras] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [presentesHoje, setPresentesHoje] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [valorTotalHoje, setValorTotalHoje] = useState(0);
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const hoje = new Date();
  const hojeFormatado = format(hoje, "dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const dataStr = format(hoje, 'yyyy-MM-dd');
        const stats = await api.getDashboardStats(dataStr);
        
        setTotalObras(stats.totalObras);
        setTotalFuncionarios(stats.totalFuncionarios);
        setPresentesHoje(stats.presentesHoje);
        setFaltasHoje(stats.faltasHoje);
        setValorTotalHoje(stats.valorTotalHoje);
      } catch (error) {
        setErro('Ocorreu um erro ao carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const indicadores = [
    { name: 'Obras Ativas', value: totalObras, icon: HardHat, color: 'text-[#0B1B33]', bg: 'bg-[#0B1B33]/5', border: 'border-[#0B1B33]/10' },
    { name: 'Total de Funcionários', value: totalFuncionarios, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { name: 'Presentes Hoje', value: presentesHoje, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { name: 'Faltas Hoje', value: faltasHoje, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="w-full mx-auto space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-[#0B1B33] tracking-tight uppercase">Central de Operações</h2>
          <p className="mt-1 text-sm font-medium text-gray-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C6922E]" />
            Hoje é {hojeFormatado}
          </p>
        </div>
      </div>

      {erro && (
        <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          {erro}
        </div>
      )}

      {/* Main Grid: Highlight + Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        
        {/* Highlight Card - Left on Desktop */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#0B1B33] rounded-[24px] p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group min-w-0">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute top-[-20%] right-[-10%] w-[150%] h-[1px] bg-[#C6922E]/20 transform rotate-12 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="inline-flex items-center self-start gap-2 px-3 py-1.5 rounded-md bg-[#C6922E]/10 text-[11px] font-bold text-[#C6922E] uppercase tracking-wider mb-6 sm:mb-8 border border-[#C6922E]/20">
              <Activity className="w-3.5 h-3.5" strokeWidth={3} />
              Diárias de Hoje
            </div>
            
            <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Custo Estimado</div>
            <div className="text-[clamp(2.2rem,4vw,3rem)] font-bold tracking-tight text-white mb-6 sm:mb-8 break-words leading-none">
              {isLoading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valorTotalHoje)}
            </div>
            
            <div className="mt-auto">
               <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                 <div className="bg-gradient-to-r from-[#C6922E] to-[#E3B75C] h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: totalFuncionarios ? `${(presentesHoje / totalFuncionarios) * 100}%` : '0%' }} />
               </div>
               <div className="mt-3 text-[12px] sm:text-[13px] text-gray-400 flex justify-between font-medium uppercase tracking-wide">
                 <span>Taxa de presença</span>
                 <span className="text-white font-bold">
                   {totalFuncionarios ? Math.round((presentesHoje / totalFuncionarios) * 100) : 0}%
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* Indicators Grid - Right on Desktop */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
           {indicadores.map((card) => (
             <div key={card.name} className={`bg-white rounded-[20px] p-5 sm:p-6 border ${card.border} shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-center min-w-0`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest truncate">{card.name}</p>
                    <p className="text-[1.75rem] sm:text-[2rem] font-extrabold text-[#0B1B33] mt-1 leading-none truncate">
                      {isLoading ? '...' : card.value}
                    </p>
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-2xl shrink-0 ${card.bg}`}>
                    <card.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${card.color}`} strokeWidth={2.5} />
                  </div>
                </div>
             </div>
           ))}
        </div>

      </div>
      
      {/* Push Diagnostic */}
      <div className="pt-4 sm:pt-6">
        <PushDiagnostic />
      </div>

    </div>
  );
}
