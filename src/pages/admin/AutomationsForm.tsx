import React, { useState, useEffect } from 'react';
import { X, Save, Send } from 'lucide-react';
import { AutomationRule, AutomationEventCatalog } from '../../lib/types';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface AutomationsFormProps {
  rule: AutomationRule | null;
  catalog: AutomationEventCatalog[];
  onClose: () => void;
  onSave: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => void;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];
const DESTINATARIOS = [
  { value: 'ADMIN', label: 'Administradores' },
  { value: 'OPERADORES', label: 'Operadores' },
  { value: 'TODOS', label: 'Todos' }
];
const CANAIS = ['CENTRAL', 'PUSH'];
const TIPOS = ['PROGRAMADA', 'CONDICIONAL', 'EVENTO'] as const;

export default function AutomationsForm({ rule, catalog, onClose, onSave }: AutomationsFormProps) {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState<Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    kind: 'PROGRAMADA',
    module: catalog.length > 0 ? catalog[0].module : 'GERAL',
    is_active: true,
    message_template: '',
    title_template: '',
    days_of_week: [],
    schedule_time: '08:00',
    timezone: 'America/Maceio',
    recipients: [],
    channels: [],
    trigger_code: ''
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        kind: rule.kind,
        module: rule.module,
        is_active: rule.is_active,
        message_template: rule.message_template || '',
        title_template: rule.title_template || '',
        days_of_week: rule.days_of_week || [],
        schedule_time: rule.schedule_time !== null && rule.schedule_time !== undefined ? rule.schedule_time : null as any,
        timezone: rule.timezone !== null && rule.timezone !== undefined ? rule.timezone : null as any,
        recipients: rule.recipients || [],
        channels: rule.channels || [],
        trigger_code: rule.trigger_code !== null && rule.trigger_code !== undefined ? rule.trigger_code : null as any
      });
    }
  }, [rule]);

  const availableModules = Array.from(new Set(catalog.map(c => c.module)));
  const availableEvents = catalog.filter(c => c.module === formData.module);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Nome da automação é obrigatório.');
    if (!formData.message_template.trim()) return alert('Mensagem é obrigatória.');
    if (!formData.recipients || formData.recipients.length === 0) return alert('Selecione pelo menos um destinatário.');
    if (!formData.channels || formData.channels.length === 0) return alert('Selecione pelo menos um canal.');

    const payload = { ...formData };
    
    // Normalize empty strings
    if (!payload.title_template) payload.title_template = '';
    
    if (payload.kind === 'EVENTO') {
      if (!payload.trigger_code) return alert('Selecione o evento que irá disparar a automação.');
      payload.schedule_time = null as any;
      payload.timezone = null as any;
      payload.days_of_week = [];
    } else if (payload.kind === 'PROGRAMADA') {
      if (!payload.schedule_time) return alert('Horário é obrigatório para automações programadas.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return alert('Selecione pelo menos um dia da semana.');
      payload.trigger_code = null as any;
    } else if (payload.kind === 'CONDICIONAL') {
      if (!payload.schedule_time) return alert('Horário é obrigatório para automações condicionais.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return alert('Selecione pelo menos um dia da semana.');
      if (!payload.trigger_code) return alert('Selecione o evento condicional.');
    }

    onSave(payload);
  };

  const toggleArrayItem = (field: 'days_of_week' | 'recipients' | 'channels', item: any) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const handleTest = async () => {
    if (!formData.channels || formData.channels.length === 0) {
      return alert('Selecione pelo menos um canal para enviar o teste.');
    }
    if (!usuario?.id) {
      return alert('Não foi possível identificar o usuário atual.');
    }
    try {
      await api.sendAutomationTest({
        title: formData.title_template || 'Teste de Automação',
        message: formData.message_template || '',
        channels: formData.channels as string[],
        userId: usuario.id
      });
      alert('Teste enviado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      if (error.message === 'PUSH_FAILED') {
        alert('Comunicação criada, mas o Push não pôde ser enviado.');
      } else {
        alert(error.message || 'Erro real da operação.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {rule ? 'Editar Automação' : 'Nova Automação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="automationForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Nome da Automação</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Tipo</label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as any })}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50"
                >
                  {TIPOS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Módulo</label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="GERAL">Geral</option>
                  {availableModules.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {(formData.kind === 'CONDICIONAL' || formData.kind === 'EVENTO') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Evento / Condição</label>
                  <select
                    value={formData.trigger_code}
                    onChange={(e) => setFormData({ ...formData, trigger_code: e.target.value })}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um evento...</option>
                    {availableEvents.map(e => (
                      <option key={e.event_code} value={e.event_code}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {(formData.kind === 'PROGRAMADA' || formData.kind === 'CONDICIONAL') && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm">Agendamento</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map(dia => (
                      <label key={dia.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(formData.days_of_week || []).includes(dia.value)}
                          onChange={() => toggleArrayItem('days_of_week', dia.value)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{dia.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Horário</label>
                    <input
                      type="time"
                      value={formData.schedule_time || ''}
                      onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Fuso Horário</label>
                    <select
                      value={formData.timezone || 'America/Maceio'}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="America/Maceio">America/Maceio</option>
                      <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Destinatários</label>
                <div className="space-y-2">
                  {DESTINATARIOS.map(dest => (
                    <label key={dest.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.recipients || []).includes(dest.value)}
                        onChange={() => toggleArrayItem('recipients', dest.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{dest.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Canais</label>
                <div className="space-y-2">
                  {CANAIS.map(canal => (
                    <label key={canal} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.channels || []).includes(canal)}
                        onChange={() => toggleArrayItem('channels', canal)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        {canal === 'CENTRAL' ? 'Central de Comunicações' : 'Push Notification'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Título da Mensagem</label>
                <input
                  type="text"
                  value={formData.title_template || ''}
                  onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                  placeholder="Ex: 🔔 Lembrete de Presença"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Mensagem</label>
                <textarea
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-sm font-medium text-slate-700">
                  {formData.is_active ? 'Automação Ativa' : 'Automação Inativa'}
                </span>
              </label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-xl">
          <button
            type="button"
            onClick={handleTest}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            Enviar Teste
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="automationForm"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
