import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Usuario } from '../../lib/types';
import { Bell, FileText, History, Wrench, FilePlus, ChevronRight, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

export default function CentralComunicacoes() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'sugestoes' | 'nova' | 'historico'>('sugestoes');

  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Comunicações</h1>
          <p className="text-gray-500 mt-1">Gerencie notificações push e receba sugestões automáticas.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sugestoes')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
              activeTab === 'sugestoes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sugestões
          </button>
          <button
            onClick={() => setActiveTab('nova')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
              activeTab === 'nova' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nova Comunicação
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
              activeTab === 'historico' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Histórico
          </button>
        </div>
      </div>

      {activeTab === 'sugestoes' && <SugestoesTab />}
      {activeTab === 'nova' && <NovaComunicacaoTab />}
      {activeTab === 'historico' && <HistoricoTab />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: SUGESTÕES
// -------------------------------------------------------------
function SugestoesTab() {
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSugestoes();
  }, []);

  async function loadSugestoes() {
    try {
      setLoading(true);
      // Fetch sugestoes (Mock for now since we don't have the table yet, 
      // but we will implement the API endpoint to use existing data or the new table)
      const data = await api.getCentralSugestoes();
      setSugestoes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando sugestões...</div>;
  }

  return (
    <div className="space-y-4">
      {sugestoes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="text-green-600 w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Tudo tranquilo!</h3>
          <p className="text-gray-500 mt-1">Não há sugestões de notificações no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sugestoes.map(s => (
            <SugestaoCard key={s.id} sugestao={s} onUpdate={loadSugestoes} />
          ))}
        </div>
      )}
    </div>
  );
}

function SugestaoCard({ sugestao, onUpdate }: { sugestao: any, onUpdate: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleOpen = () => {
    setTitle(sugestao.titulo);
    setMessage(sugestao.mensagem);
    setModalOpen(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.sendCentralCommunication({
        titulo: title,
        mensagem: message,
        destinatarios: sugestao.destinatarios || [],
        sugestao_id: sugestao.id
      });
      setModalOpen(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar notificação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-amber-600 mb-2 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            {sugestao.tipo === 'ferramenta_pendente' ? 'Ferramenta não devolvida' : 
             sugestao.tipo === 'ferramenta_quebrada' ? 'Ferramenta quebrada' : 
             sugestao.tipo === 'novo_atestado' ? 'Novo Atestado' : 'Sugestão'}
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{sugestao.titulo}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{sugestao.mensagem}</p>
          <div className="text-xs text-gray-400 mt-3">{format(new Date(sugestao.created_at), 'HH:mm - dd/MM')}</div>
        </div>
        <button 
          onClick={handleOpen}
          className="mt-4 w-full flex items-center justify-center py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200"
        >
          Visualizar <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleSend}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">Revisar Notificação</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Título</label>
                      <input
                        required
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {saving ? 'Enviando...' : 'Enviar Notificação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// TAB 2: NOVA COMUNICAÇÃO
// -------------------------------------------------------------
function NovaComunicacaoTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [operators, setOperators] = useState<Usuario[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getOperators().then(data => {
      // Filter out non-operators or keep only Carlos/Junior based on requirements
      // "Only these users will use this feature: Administrator, Carlos, Junior."
      setOperators(data || []);
    });
  }, []);

  const templates = [
    { label: 'Reunião', title: 'REUNIÃO', msg: 'Passar no escritório às 17:00.' },
    { label: 'Aviso Geral', title: 'AVISO IMPORTANTE', msg: 'Por favor, verifiquem o novo protocolo de segurança no mural.' },
    { label: 'Ferramenta Pendente', title: 'Ferramenta pendente', msg: 'Você possui ferramentas que não foram devolvidas no prazo.' }
  ];

  const applyTemplate = (t: any) => {
    setTitle(t.title);
    setMessage(t.msg);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (destinatarios.length === 0) {
      alert('Selecione pelo menos um destinatário.');
      return;
    }
    
    try {
      setSaving(true);
      await api.sendCentralCommunication({
        titulo: title,
        mensagem: message,
        destinatarios: destinatarios
      });
      alert('Comunicação enviada com sucesso!');
      setTitle('');
      setMessage('');
      setDestinatarios([]);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar comunicação');
    } finally {
      setSaving(false);
    }
  };

  const toggleDestinatario = (id: string) => {
    if (destinatarios.includes(id)) {
      setDestinatarios(destinatarios.filter(d => d !== id));
    } else {
      setDestinatarios([...destinatarios, id]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Templates Rápidos</h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((t, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(t)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            required
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: REUNIÃO"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Passar no escritório às 17:00."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Destinatários</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {operators.map(op => (
              <label 
                key={op.id} 
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  destinatarios.includes(op.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={destinatarios.includes(op.id)}
                  onChange={() => toggleDestinatario(op.id)}
                />
                <span className="ml-3 text-sm font-medium text-gray-900">{(op as any).usuario}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center items-center rounded-lg shadow-sm px-6 py-2.5 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="w-5 h-5 mr-2" />
            {saving ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 3: HISTÓRICO
// -------------------------------------------------------------
function HistoricoTab() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCentralComunicacoes().then(data => {
      setHistorico(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      {historico.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Nenhuma comunicação no histórico.
        </div>
      ) : (
        historico.map(h => (
          <div key={h.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{h.titulo}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{h.mensagem}</p>
              
              <div className="text-xs text-gray-500 mb-4">
                Enviado por: <span className="font-medium text-gray-700">{h.remetente?.usuario || 'Sistema'}</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Status de Leitura:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {h.destinatarios && h.destinatarios.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-sm">
                      <span className="font-medium text-gray-700">{d.usuario?.usuario}</span>
                      {d.lida ? (
                        <span className="flex items-center text-green-600 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Lida às {format(new Date(d.data_leitura), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Ainda não visualizada</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
