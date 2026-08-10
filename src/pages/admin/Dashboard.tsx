import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { HardHat, Users, CheckCircle, XCircle, DollarSign, ArrowRight, Activity, Calendar, Megaphone, CheckCircle2, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [totalObras, setTotalObras] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [presentesHoje, setPresentesHoje] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [valorTotalHoje, setValorTotalHoje] = useState(0);
  const [totalComms, setTotalComms] = useState(0);
  const [readComms, setReadComms] = useState(0);
  const [unreadComms, setUnreadComms] = useState(0);
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
        setTotalComms(stats.totalComms);
        setReadComms(stats.readComms);
        setUnreadComms(stats.unreadComms);
      } catch (error) {
        setErro('Ocorreu um erro ao carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const topCards = [
    { name: 'Obras Ativas', value: totalObras, icon: HardHat, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { name: 'Total de Funcionários', value: totalFuncionarios, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
  ];

  const todayCards = [
    { name: 'Presentes', value: presentesHoje, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { name: 'Faltas', value: faltasHoje, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h2>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Hoje é {hojeFormatado}
          </p>
        </div>
      </div>

      {erro && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500" />
          {erro}
        </div>
      )}

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Highlight Card */}
        <div className="md:col-span-12 lg:col-span-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-gray-300 backdrop-blur-md border border-white/10 mb-6">
              <Activity className="w-3.5 h-3.5" />
              Diárias de Hoje
            </div>
            <div className="text-sm font-medium text-gray-400 mb-1">Custo Estimado</div>
            <div className="text-4xl lg:text-5xl font-bold tracking-tight">
              {isLoading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valorTotalHoje)}
            </div>
          </div>
          <div className="relative z-10 mt-8">
             <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
               <div className="bg-emerald-400 h-full rounded-full w-3/4" style={{ width: totalFuncionarios ? `${(presentesHoje / totalFuncionarios) * 100}%` : '0%' }} />
             </div>
             <div className="mt-3 text-sm text-gray-400 flex justify-between">
               <span>Taxa de presença</span>
               <span className="text-white font-medium">
                 {totalFuncionarios ? Math.round((presentesHoje / totalFuncionarios) * 100) : 0}%
               </span>
             </div>
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="space-y-6">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Geral</h3>
             {topCards.map((card) => (
               <div key={card.name} className={`bg-white rounded-2xl p-6 border ${card.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{isLoading ? '...' : card.value}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${card.bg}`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
               </div>
             ))}
           </div>
           
           <div className="space-y-6">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Presença Hoje</h3>
             {todayCards.map((card) => (
               <div key={card.name} className={`bg-white rounded-2xl p-6 border ${card.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{isLoading ? '...' : card.value}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${card.bg}`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>
      
      <div className="text-center pt-8">
         <span className="text-xs font-medium text-gray-400">Versão 2.0.0</span>
      </div>
    </div>
  );
}
