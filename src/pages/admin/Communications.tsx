import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Communication, Usuario } from '../../lib/types';
import { Loader2, Plus, Megaphone, Trash2, Edit2, CheckCircle2, XCircle, Users, Clock, AlertTriangle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

export default function Communications() {
  const { usuario } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [operators, setOperators] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Locked if someone has read it
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'INFO',
    priority: 'NORMAL',
    expiration_date: '',
    target_audience: 'ALL',
    target_operator_id: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);
  
  // Reads modal
  const [readsModalOpen, setReadsModalOpen] = useState(false);
  const [currentCommReads, setCurrentCommReads] = useState<any[]>([]);
  const [loadingReads, setLoadingReads] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [commsData, opsData] = await Promise.all([
        api.getCommunications(),
        api.getOperators()
      ]);
      setCommunications(commsData || []);
      setOperators(opsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = async (comm?: Communication) => {
    if (comm) {
      setEditingId(comm.id);
      setForm({
        title: comm.title,
        message: comm.message,
        type: comm.type,
        priority: comm.priority,
        expiration_date: comm.expiration_date || '',
        target_audience: comm.target_audience,
        target_operator_id: comm.target_operator_id || '',
        is_active: comm.is_active
      });
      
      // Check if locked
      try {
        const reads = await api.getCommunicationRecipients(comm.id);
        setIsLocked(reads.length > 0);
      } catch(e) {
        setIsLocked(false);
      }
      
    } else {
      setEditingId(null);
      setIsLocked(false);
      setForm({
        title: '',
        message: '',
        type: 'INFO',
        priority: 'NORMAL',
        expiration_date: '',
        target_audience: 'ALL',
        target_operator_id: '',
        is_active: true
      });
    }
    setSelectedFiles([]);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    
    setSaving(true);
    setUploading(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        expiration_date: form.expiration_date || null,
        target_audience: form.target_audience,
        target_operator_id: form.target_audience === 'SPECIFIC' ? form.target_operator_id : null,
        is_active: form.is_active,
        created_by: usuario?.id
      };

      let commId = editingId;

      if (editingId) {
        if (!isLocked) {
           await api.updateCommunication(editingId, payload);
        } else {
           // Can only update is_active if locked
           await api.updateCommunication(editingId, { is_active: form.is_active });
        }
      } else {
        const created = await api.createCommunication(payload);
        commId = created.id;
      }

      // Handle file uploads
      if (selectedFiles.length > 0 && commId) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `comm_${commId}_${Date.now()}.${fileExt}`;
          
          const filePath = await api.uploadPhoto('communication-files', file, fileName);
          
          await api.createCommunicationAttachment({
            communication_id: commId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream'
          });
        }
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar comunicação. ' + (err as any).message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover esta comunicação? O histórico de leitura será perdido.')) return;
    try {
      await api.deleteCommunication(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir comunicação. ' + (err as any).message);
    }
  };
  
  const handleViewReads = async (comm: Communication) => {
    setReadsModalOpen(true);
    setLoadingReads(true);
    setCurrentCommReads([]);
    try {
      const reads = await api.getCommunicationRecipients(comm.id);
      setCurrentCommReads(reads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReads(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'INFO': '📢 Informação',
      'ATTENTION': '⚠ Atenção',
      'URGENT': '🚨 Urgente',
      'EMPLOYEE': '👷 Funcionário',
      'WORKSITE': '🏗 Obra',
      'MATERIAL': '📦 Material',
      'MEDICAL_CERTIFICATE': '🩺 Atestado Médico'
    };
    return types[type] || type;
  };
  
  // Dashboard Counters
  const unreadCount = communications.filter(c => c.is_active && c.priority === 'URGENT').length; // Approximation for dashboard

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicações Operacionais</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie avisos e instruções obrigatórias para os operadores.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Comunicação
        </button>
      </div>
      
      {/* Widget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500">Total Enviadas</p>
             <h3 className="text-2xl font-bold text-gray-900 mt-1">{communications.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl"><Megaphone className="w-6 h-6 text-blue-600" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500">Ativas Obrigatórias</p>
             <h3 className="text-2xl font-bold text-gray-900 mt-1">{communications.filter(c => c.is_active && c.priority === 'URGENT').length}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : communications.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {communications.map(c => (
              <li key={c.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0 ${c.priority === 'URGENT' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Megaphone className={`h-5 w-5 ${c.priority === 'URGENT' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
                        {!c.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inativa
                          </span>
                        )}
                        {c.priority === 'URGENT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                            Obrigatória
                          </span>
                        )}
                        <span className="text-xs text-gray-500 border px-2 py-0.5 rounded">{getTypeLabel(c.type)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">{c.message}</p>
                      
                      <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Criado em {format(parseISO(c.created_at), 'dd/MM/yyyy')}</span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1"/> 
                          {c.target_audience === 'ALL' ? 'Todos os Operadores' : (c.target_operator ? (c.target_operator as any).usuario : 'Operador Específico')}
                        </span>
                        {c.expiration_date && (
                           <span className="flex items-center text-orange-600 font-medium">Expira em {format(parseISO(c.expiration_date), 'dd/MM/yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:self-center self-end">
                    <button
                      onClick={() => handleViewReads(c)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      title="Ver Leituras"
                    >
                      <Eye className="h-4 w-4 mr-1 text-gray-400" />
                      Status
                    </button>
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <Megaphone className="h-12 w-12 text-gray-300 mb-4" />
             <p className="text-lg font-medium text-gray-900">Nenhuma comunicação enviada</p>
             <p className="mt-1">Crie mensagens para orientar os operadores.</p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl w-full">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4 border-b pb-2">
                    {editingId ? 'Editar Comunicação' : 'Nova Comunicação'}
                  </h3>
                  
                  {isLocked && (
                    <div className="mb-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Esta comunicação já foi lida por pelo menos um operador e está bloqueada para edição (Regra de Auditoria). Você pode apenas alterar seu status (Ativa/Inativa).
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                          type="text"
                          required
                          disabled={isLocked}
                          value={form.title}
                          onChange={(e) => setForm({...form, title: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                          value={form.type}
                          disabled={isLocked}
                          onChange={(e) => setForm({...form, type: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
                        >
                          <option value="INFO">📢 Informação</option>
                          <option value="ATTENTION">⚠ Atenção</option>
                          <option value="URGENT">🚨 Urgente</option>
                          <option value="EMPLOYEE">👷 Funcionário</option>
                          <option value="WORKSITE">🏗 Obra</option>
                          <option value="MATERIAL">📦 Material</option>
                          <option value="MEDICAL_CERTIFICATE">🩺 Atestado Médico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                        <select
                          value={form.priority}
                          disabled={isLocked}
                          onChange={(e) => setForm({...form, priority: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="URGENT">Urgente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Destinatários</label>
                        <select
                          value={form.target_audience}
                          disabled={isLocked}
                          onChange={(e) => setForm({...form, target_audience: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
                        >
                          <option value="ALL">Todos os Operadores</option>
                          <option value="SPECIFIC">Operador Específico</option>
                        </select>
                      </div>

                      {form.target_audience === 'SPECIFIC' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Operador</label>
                          <select
                            required
                            disabled={isLocked}
                            value={form.target_operator_id}
                            onChange={(e) => setForm({...form, target_operator_id: e.target.value})}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
                          >
                            <option value="">Selecione...</option>
                            {operators.map(op => (
                              <option key={op.id} value={op.id}>{(op as any).usuario}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={form.target_audience === 'ALL' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                        <label className="block text-sm font-medium text-gray-700">Data de Expiração (Opcional)</label>
                        <input
                          type="date"
                          disabled={isLocked}
                          value={form.expiration_date}
                          onChange={(e) => setForm({...form, expiration_date: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                      <textarea
                        required
                        rows={5}
                        disabled={isLocked}
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    
                    
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anexos (Opcional - Imagens ou PDF)</label>
                        <input
                          type="file"
                          multiple
                          disabled={isLocked}
                          accept="image/*,application/pdf"
                          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                        {selectedFiles.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            {selectedFiles.length} arquivo(s) selecionado(s)
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-4">

                      <input
                        id="is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({...form, is_active: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                        Comunicação Ativa
                      </label>
                    </div>

                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
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
      
      {/* Reads Modal */}
      {readsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setReadsModalOpen(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                 <div className="flex justify-between items-center mb-5 border-b pb-4">
                    <h3 className="text-lg leading-6 font-bold text-gray-900">
                      Status de Leitura
                    </h3>
                    <button onClick={() => setReadsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <XCircle className="w-6 h-6" />
                    </button>
                 </div>
                 
                 {loadingReads ? (
                   <div className="flex justify-center py-8">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                   </div>
                 ) : currentCommReads.length > 0 ? (
                   <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                     {currentCommReads.map(r => (
                       <li key={r.id} className="py-3 flex justify-between items-center">
                         <div>
                           <p className="text-sm font-bold text-gray-900">{r.operator?.usuario}</p>
                           <p className="text-xs text-gray-500 flex items-center mt-0.5">
                             <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                             Lido em {format(parseISO(r.read_at), 'dd/MM/yyyy HH:mm')}
                           </p>
                         </div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     <p>Nenhum operador confirmou a leitura ainda.</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
