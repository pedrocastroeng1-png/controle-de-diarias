import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, ShieldCheck, CreditCard, DollarSign } from 'lucide-react';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    empresas: 0,
    assinaturas: 0,
    pagamentos: 0,
    receita: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { count: empresasCount } = await supabase.from('empresas').select('*', { count: 'exact', head: true });
        const { count: assinaturasCount } = await supabase.from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'ATIVA');
        const { count: pagamentosCount } = await supabase.from('platform_payments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
        
        // Receita mensal: sum of all active subscriptions
        const { data: assinaturas } = await supabase.from('assinaturas')
          .select('plano_id, planos(valor_mensal)')
          .eq('status', 'ATIVA');
          
        let receita = 0;
        if (assinaturas) {
          receita = assinaturas.reduce((acc, curr: any) => acc + (curr.planos?.valor_mensal || 0), 0);
        }

        setStats({
          empresas: empresasCount || 0,
          assinaturas: assinaturasCount || 0,
          pagamentos: pagamentosCount || 0,
          receita
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Administrativo</h1>
        <p className="text-gray-500 mt-1">Visão geral da plataforma e assinaturas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Empresas Ativas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.empresas}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Assinaturas Ativas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.assinaturas}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pagamentos Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pagamentos}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Receita Mensal</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receita)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
