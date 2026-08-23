const fs = require('fs');

const content = `import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { HardHat, Users, CheckCircle, XCircle, Activity, Calendar, ArrowRight, BarChart3, Clock, Plus, FileText, ClipboardList } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PushDiagnostic } from '../../components/PushDiagnostic';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [totalObras, setTotalObras] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [presentesHoje, setPresentesHoje] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [valorTotalHoje, setValorTotalHoje] = useState(0);
  
  const [obrasStats, setObrasStats] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const hoje = new Date();
  const hojeFormatado = format(hoje, "dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const dataStr = format(hoje, 'yyyy-MM-dd');
        const sevenDaysAgoStr = format(subDays(hoje, 6), 'yyyy-MM-dd');
        
        const [stats, obrasData, presencasHoje, relatorio7d] = await Promise.all([
          api.getDashboardStats(dataStr),
          api.getObras(),
          api.getPresencas(dataStr),
          api.getRelatorio(sevenDaysAgoStr, dataStr)
        ]);
        
        setTotalObras(stats.totalObras);
        setTotalFuncionarios(stats.totalFuncionarios);
        setPresentesHoje(stats.presentesHoje);
        setFaltasHoje(stats.faltasHoje);
        setValorTotalHoje(stats.valorTotalHoje);

        // Process Visão das Obras
        const oStats = obrasData.map(obra => {
          const pObra = presencasHoje.filter(p => p.funcionario?.obra?.id === obra.id);
          const total = pObra.length;
          const presentes = pObra.filter(p => p.presente === true).length;
          const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;
          return { ...obra, total, presentes, percentual };
        }).filter(o => o.total > 0).sort((a, b) => b.total - a.total);
        setObrasStats(oStats);

        // Process Evolução (7 dias)
        const evolutionMap = new Map();
        for (let i = 6; i >= 0; i--) {
           const d = format(subDays(hoje, i), 'yyyy-MM-dd');
           evolutionMap.set(d, { data: d, presentes: 0, faltas: 0 });
        }
        relatorio7d.forEach(p => {
           if (evolutionMap.has(p.data)) {
              const stat = evolutionMap.get(p.data);
              if (p.status === 'PRESENTE' || p.status === 'MEIA_DIARIA') stat.presentes++;
              else if (p.status === 'FALTOU') stat.faltas++;
           }
        });
        const eData = Array.from(evolutionMap.values()).map(v => ({
           name: format(parseISO(v.data), 'dd/MM'),
           Presentes: v.presentes,
           Faltas: v.faltas
        }));
        setEvolutionData(eData);

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

  const quickActions = [
    { name: 'Lançar Presença', icon: ClipboardList, path: '/admin/presenca' },
    { name: 'Nova Obra', icon: Plus, path: '/admin/obras' },
    { name: 'Novo Funcionário', icon: Users, path: '/admin/funcionarios' },
    { name: 'Ver Relatórios', icon: FileText, path: '/admin/relatorios' },
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
                      style={{ width: totalFuncionarios ? \`\${(presentesHoje / totalFuncionarios) * 100}%\` : '0%' }} />
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
             <div key={card.name} className={\`bg-white rounded-[20px] p-5 sm:p-6 border \${card.border} shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-center min-w-0\`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest truncate">{card.name}</p>
                    <p className="text-[1.75rem] sm:text-[2rem] font-extrabold text-[#0B1B33] mt-1 leading-none truncate">
                      {isLoading ? '...' : card.value}
                    </p>
                  </div>
                  <div className={\`p-3.5 sm:p-4 rounded-2xl shrink-0 \${card.bg}\`}>
                    <card.icon className={\`h-6 w-6 sm:h-7 sm:w-7 \${card.color}\`} strokeWidth={2.5} />
                  </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Second Section: Obras & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        
        {/* Visão das Obras */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[24px] shadow-sm flex flex-col min-w-0 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-[14px] font-bold text-[#0B1B33] uppercase tracking-wider flex items-center gap-2">
              <HardHat className="w-4 h-4 text-[#C6922E]" />
              Visão das Obras
            </h3>
            <Link to="/admin/obras" className="text-[12px] font-bold text-[#C6922E] hover:text-[#0B1B33] uppercase tracking-wider flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
               <div className="p-8 text-center text-gray-400 text-sm font-medium">Carregando obras...</div>
            ) : obrasStats.length > 0 ? (
               <div className="divide-y divide-gray-100">
                 {obrasStats.map(obra => (
                   <div key={obra.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                     <div className="min-w-0 flex-1">
                       <h4 className="text-[14px] font-bold text-gray-900 truncate">{obra.nome}</h4>
                       <div className="flex items-center gap-3 mt-1.5 text-[12px] font-medium text-gray-500">
                         <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {obra.total} func.</span>
                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                         <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> {obra.presentes} presentes</span>
                       </div>
                     </div>
                     <div className="shrink-0 flex items-center gap-3">
                       <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
                         <div className={\`h-full rounded-full \${obra.percentual >= 80 ? 'bg-emerald-500' : obra.percentual >= 50 ? 'bg-amber-500' : 'bg-rose-500'}\`} style={{ width: \`\${obra.percentual}%\` }} />
                       </div>
                       <span className={\`text-[15px] font-bold \${obra.percentual >= 80 ? 'text-emerald-600' : obra.percentual >= 50 ? 'text-amber-600' : 'text-rose-600'} w-12 text-right\`}>
                         {obra.percentual}%
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="p-8 text-center text-gray-400 text-sm font-medium">Nenhuma obra com funcionários ativos hoje.</div>
            )}
          </div>
        </div>

        {/* Evolução da Presença */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-[24px] shadow-sm flex flex-col min-w-0 overflow-hidden">
           <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
             <h3 className="text-[14px] font-bold text-[#0B1B33] uppercase tracking-wider flex items-center gap-2">
               <BarChart3 className="w-4 h-4 text-[#C6922E]" />
               Evolução (7 Dias)
             </h3>
           </div>
           <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center min-w-0">
             {isLoading ? (
               <div className="py-12 text-center text-gray-400 text-sm font-medium">Carregando gráfico...</div>
             ) : evolutionData.length > 0 ? (
               <div className="h-[220px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={evolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} axisLine={false} tickLine={false} />
                     <Tooltip 
                       cursor={{ fill: '#F9FAFB' }} 
                       contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                     />
                     <Bar dataKey="Presentes" fill="#0B1B33" radius={[4, 4, 0, 0]} maxBarSize={30} />
                     <Bar dataKey="Faltas" fill="#E5E7EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             ) : (
               <div className="py-12 text-center text-gray-400 text-sm font-medium">Sem dados suficientes para o gráfico.</div>
             )}
             
             <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#0B1B33]"></div> Presentes</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#E5E7EB]"></div> Faltas</span>
             </div>
           </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm p-5 sm:p-6 min-w-0">
        <h3 className="text-[14px] font-bold text-[#0B1B33] uppercase tracking-wider mb-4 sm:mb-6">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => (
             <Link key={idx} to={action.path} className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-[16px] bg-gray-50 border border-gray-100 hover:bg-[#0B1B33] hover:border-[#0B1B33] group transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <action.icon className="w-5 h-5 text-[#C6922E]" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-gray-700 uppercase tracking-wider text-center group-hover:text-white transition-colors">{action.name}</span>
             </Link>
          ))}
        </div>
      </div>

      {/* Push Diagnostic (Compact) */}
      <div className="pt-4 sm:pt-6">
        <PushDiagnostic />
      </div>

    </div>
  );
}
`;
fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
