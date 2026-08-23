import fs from 'fs';

let content = `import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { HardHat, Users, CheckCircle, XCircle, Calendar, ArrowRight, BarChart3, ShieldAlert } from 'lucide-react';
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
    { name: 'Obras Ativas', value: totalObras, icon: HardHat, color: 'text-[#C9972B]', bg: 'bg-[#081B36]/5', border: 'border-transparent' },
    { name: 'Total de Funcionários', value: totalFuncionarios, icon: Users, color: 'text-[#3B82F6]', bg: 'bg-blue-50', border: 'border-transparent' },
    { name: 'Presentes Hoje', value: presentesHoje, icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-emerald-50', border: 'border-transparent' },
    { name: 'Faltas Hoje', value: faltasHoje, icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-red-50', border: 'border-transparent' },
  ];

  const taxaPresenca = totalFuncionarios ? Math.round((presentesHoje / totalFuncionarios) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-w-0">
      
      {/* 2. CABEÇALHO */}
      <div className="flex flex-col min-w-0">
        <h2 className="text-[28px] md:text-[32px] font-extrabold text-[#081B36] tracking-tight uppercase leading-none">
          Central de Operações
        </h2>
        <p className="mt-2 text-[14px] font-medium text-gray-500 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C9972B]" />
          Hoje é {hojeFormatado}
        </p>
      </div>

      {erro && (
        <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          {erro}
        </div>
      )}

      {/* 3. PRIMEIRO BLOCO — RESUMO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        
        {/* Card Principal */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#081B36] rounded-[24px] p-8 text-white shadow-lg flex flex-col justify-between relative overflow-hidden min-w-0">
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-[16px] font-bold text-[#C9972B] uppercase tracking-wider mb-8">
              Diárias de Hoje
            </h3>
            
            <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Custo Estimado
            </div>
            <div className="text-[36px] md:text-[42px] font-extrabold tracking-tight text-white mb-auto leading-none break-words">
              {isLoading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valorTotalHoje)}
            </div>
            
            <div className="mt-10">
               <div className="flex justify-between items-end mb-3">
                 <span className="text-[13px] text-gray-400 font-medium uppercase tracking-wide">
                   Taxa de presença
                 </span>
                 <span className="text-[16px] text-white font-bold">
                   {taxaPresenca}%
                 </span>
               </div>
               <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                 <div className="bg-[#C9972B] h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: \`\${taxaPresenca}%\` }} />
               </div>
            </div>
          </div>
        </div>

        {/* Indicadores Grid */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
           {indicadores.map((card) => (
             <div key={card.name} className={\`bg-white rounded-[20px] p-6 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center min-w-0\`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest truncate">
                      {card.name}
                    </p>
                    <p className="text-[32px] font-extrabold text-[#081B36] mt-2 leading-none truncate">
                      {isLoading ? '...' : card.value}
                    </p>
                  </div>
                  <div className={\`p-4 rounded-[16px] shrink-0 \${card.bg}\`}>
                    <card.icon className={\`h-7 w-7 \${card.color}\`} strokeWidth={2.5} />
                  </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* 4. VISÃO DAS OBRAS & 5. EVOLUÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        
        {/* Visão das Obras */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#081B36] uppercase tracking-wider">
              Visão das Obras
            </h3>
            <Link to="/admin/obras" className="text-[12px] font-bold text-[#C9972B] hover:text-[#081B36] uppercase tracking-wider flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
               <div className="p-8 text-center text-gray-400 text-sm font-medium">Carregando obras...</div>
            ) : obrasStats.length > 0 ? (
               <div className="divide-y divide-gray-50">
                 {obrasStats.map(obra => (
                   <div key={obra.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors min-w-[300px]">
                     <div className="min-w-0 flex-1">
                       <h4 className="text-[15px] font-bold text-gray-900 truncate mb-1">{obra.nome}</h4>
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-gray-500">
                         <span>{obra.total} func.</span>
                         <span className="flex items-center gap-1 text-[#10B981]">
                           <CheckCircle className="w-3.5 h-3.5" /> {obra.presentes} presentes
                         </span>
                       </div>
                     </div>
                     <div className="shrink-0 flex items-center gap-4">
                       <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
                         <div className="h-full rounded-full bg-[#081B36]" style={{ width: \`\${obra.percentual}%\` }} />
                       </div>
                       <span className="text-[15px] font-bold text-[#081B36] w-12 text-right">
                         {obra.percentual}%
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="p-8 text-center text-gray-400 text-sm font-medium">Nenhuma obra ativa com funcionários hoje.</div>
            )}
          </div>
        </div>

        {/* Evolução (7 Dias) */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col min-w-0 overflow-hidden">
           <div className="p-6 border-b border-gray-50">
             <h3 className="text-[14px] font-bold text-[#081B36] uppercase tracking-wider">
               Evolução (7 Dias)
             </h3>
           </div>
           <div className="p-6 flex-1 flex flex-col justify-center min-w-0">
             {isLoading ? (
               <div className="py-12 text-center text-gray-400 text-sm font-medium">Carregando gráfico...</div>
             ) : evolutionData.length > 0 ? (
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={evolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} axisLine={false} tickLine={false} />
                     <Tooltip 
                       cursor={{ fill: '#F9FAFB' }} 
                       contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '13px', fontWeight: 'bold' }} 
                     />
                     <Bar dataKey="Presentes" fill="#081B36" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="Faltas" fill="#C9972B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             ) : (
               <div className="py-12 text-center text-gray-400 text-sm font-medium">Sem dados suficientes para o gráfico.</div>
             )}
             
             <div className="mt-6 flex items-center justify-center gap-6 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#081B36]"></div> Presentes</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#C9972B]"></div> Faltas</span>
             </div>
           </div>
        </div>
      </div>

      {/* 6. DIAGNÓSTICO DO PUSH */}
      <div className="pt-4 pb-8 min-w-0">
        <PushDiagnostic />
      </div>

    </div>
  );
}
`;
fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
