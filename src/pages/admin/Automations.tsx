import React, { useState, useEffect } from 'react';
import { Plus, Bell, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { AutomationRule, AutomationEventCatalog, AutomationRun } from '../../lib/types';
import AutomationsForm from './AutomationsForm';
import { format, parseISO, isToday } from 'date-fns';

export default function Automations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [catalog, setCatalog] = useState<AutomationEventCatalog[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, catalogData, runsData] = await Promise.all([
        api.getAutomationRules(),
        api.getAutomationEventCatalog(),
        api.getAutomationRuns()
      ]);
      setRules(rulesData);
      setCatalog(catalogData);
      setRuns(runsData);
    } catch (error) {
      console.error('Error fetching automations data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (ruleData: any) => {
    try {
      if (editingRule) {
        await api.updateAutomationRule(editingRule.id, ruleData);
      } else {
        await api.createAutomationRule(ruleData);
      }
      setIsFormOpen(false);
      setEditingRule(null);
      fetchData();
    } catch (error) {
      console.error('Error saving automation rule:', error);
      alert('Erro ao salvar automação. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta automação? O histórico será mantido se aplicável.')) {
      try {
        await api.deleteAutomationRule(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting rule:', error);
        alert('Erro ao excluir automação.');
      }
    }
  };

  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      await api.updateAutomationRule(rule.id, { is_active: !rule.is_active });
      fetchData();
    } catch (error) {
      console.error('Error toggling rule active state:', error);
    }
  };

  const stats = {
    active: rules.filter(r => r.is_active).length,
    runsToday: runs.filter(r => r.created_at && isToday(parseISO(r.created_at))).length,
    failsToday: runs.filter(r => r.status === 'FALHOU' && r.created_at && isToday(parseISO(r.created_at))).length,
    lastRun: runs.length > 0 && runs[0].created_at ? format(parseISO(runs[0].created_at), 'dd/MM/yyyy HH:mm') : 'Nenhuma'
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando automações...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Mensagens Automáticas
          </h1>
          <p className="text-slate-600 mt-1">Configure alertas, lembretes e mensagens do sistema.</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setIsFormOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Automação
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">Ativas</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-semibold">Execuções Hoje</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.runsToday}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <XCircle className="w-5 h-5" />
            <h3 className="font-semibold">Falhas Hoje</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.failsToday}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Última Execução</h3>
          </div>
          <p className="text-lg font-bold text-slate-800">{stats.lastRun}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'rules' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Regras de Automação
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Histórico de Execuções
          </button>
        </div>

        <div className="p-0">
          {activeTab === 'rules' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold">Tipo</th>
                    <th className="p-4 font-semibold">Módulo</th>
                    <th className="p-4 font-semibold">Agendamento / Evento</th>
                    <th className="p-4 font-semibold">Canais</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">Nenhuma automação configurada.</td>
                    </tr>
                  ) : rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleActive(rule)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${rule.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                        >
                          {rule.is_active ? '🟢 Ativa' : '⚪ Inativa'}
                        </button>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{rule.name}</td>
                      <td className="p-4 text-slate-600 text-sm">{rule.kind}</td>
                      <td className="p-4 text-slate-600 text-sm">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">{rule.module}</span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {rule.kind === 'PROGRAMADA' && (
                          <span>{rule.schedule_time} | {rule.days_of_week?.join(', ')}</span>
                        )}
                        {(rule.kind === 'EVENTO' || rule.kind === 'CONDICIONAL') && (
                          <span>{rule.trigger_code ? catalog.find(c => c.event_code === rule.trigger_code)?.label || rule.trigger_code : '—'}</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {rule.channels?.map(c => (
                          <span key={c} className="inline-block bg-slate-100 px-2 py-1 rounded text-xs font-medium mr-1">{c}</span>
                        ))}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => { setEditingRule(rule); setIsFormOpen(true); }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold">Data/Hora</th>
                    <th className="p-4 font-semibold">Automação</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Destinatários</th>
                    <th className="p-4 font-semibold">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum histórico de execução.</td>
                    </tr>
                  ) : runs.map(run => (
                    <tr key={run.id} className="hover:bg-slate-50 text-sm">
                      <td className="p-4 text-slate-600">
                        {run.created_at ? format(parseISO(run.created_at), 'dd/MM/yyyy HH:mm:ss') : '—'}
                      </td>
                      <td className="p-4 font-medium text-slate-800">{run.rule?.name || 'Regra excluída'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          run.status === 'EXECUTADA' ? 'bg-emerald-50 text-emerald-700' :
                          run.status === 'PARCIAL' ? 'bg-amber-50 text-amber-700' :
                          run.status === 'FALHOU' ? 'bg-red-50 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {run.status === 'EXECUTADA' && '✅ '}
                          {run.status === 'PARCIAL' && '⚠️ '}
                          {run.status === 'FALHOU' && '❌ '}
                          {run.status === 'IGNORADA' && '⏸ '}
                          {run.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{run.recipients?.length || 0}</td>
                      <td className="p-4 text-slate-500">
                        {run.error_message ? <span className="text-red-600">{run.error_message}</span> : (run.message_id || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <AutomationsForm
          rule={editingRule}
          catalog={catalog}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
