import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Funcionario, AtestadoMedico } from '../../lib/types';
import { Loader2, Plus, Calendar, FileText, Trash2, Edit2, Download, Search, User } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';

export default function Atestados() {
  const [atestados, setAtestados] = useState<AtestadoMedico[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    employee_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    days: 1,
    description: '',
    photo_path: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [atestadosData, funcionariosData] = await Promise.all([
        api.getAtestados(),
        api.getFuncionarios('todos')
      ]);
      setAtestados(atestadosData || []);
      setFuncionarios(funcionariosData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (atestado?: AtestadoMedico) => {
    if (atestado) {
      setEditingId(atestado.id);
      setForm({
        employee_id: atestado.employee_id,
        start_date: atestado.start_date,
        days: atestado.days,
        description: atestado.description || '',
        photo_path: atestado.photo_path || ''
      });
    } else {
      setEditingId(null);
      setForm({
        employee_id: funcionarios[0]?.id || '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        days: 1,
        description: '',
        photo_path: ''
      });
    }
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id || !form.start_date || form.days < 1) return;
    
    setSaving(true);
    setUploading(true);
    try {
      let photo_path = form.photo_path;
      
      if (selectedFile) {
        // use standard upload flow
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${form.employee_id}_${Date.now()}.${fileExt}`;
        
        // Let's assume api.uploadAtestadoPhoto doesn't exist yet, we will add it to api.ts or just use supabase inline.
        // Wait, we can't use supabase directly here easily unless we import it.
        // So we will call api.uploadAtestadoPhoto(selectedFile, form.employee_id)
        photo_path = await api.uploadPhoto('medical-certificates', selectedFile, form.employee_id);
      }
      
      const endDate = format(addDays(parseISO(form.start_date), form.days - 1), 'yyyy-MM-dd');
      const payload = {
        employee_id: form.employee_id,
        start_date: form.start_date,
        days: form.days,
        end_date: endDate,
        description: form.description,
        photo_path: photo_path
      };

      if (editingId) {
        await api.updateAtestado(editingId, payload);
      } else {
        await api.createAtestado(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este atestado?')) return;
    try {
      await api.deleteAtestado(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAtestados = atestados.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.funcionario?.nome.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atestados Médicos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os atestados dos funcionários (bloqueio automático de presença).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Atestado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAtestados.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {filteredAtestados.map(a => (
              <li key={a.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.funcionario?.nome || 'Desconhecido'}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(parseISO(a.start_date), 'dd/MM/yyyy')} a {format(parseISO(a.end_date), 'dd/MM/yyyy')} ({a.days} dias)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(a)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
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
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
             <FileText className="h-12 w-12 text-gray-300 mb-4" />
             <p>Nenhum atestado encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4 border-b pb-2">
                    {editingId ? 'Editar Atestado' : 'Novo Atestado'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                      <select
                        required
                        value={form.employee_id}
                        onChange={(e) => setForm({...form, employee_id: e.target.value})}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {funcionarios.filter(f => f.ativo).map(f => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
                        <input
                          type="date"
                          required
                          value={form.start_date}
                          onChange={(e) => setForm({...form, start_date: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dias</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={form.days}
                          onChange={(e) => setForm({...form, days: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Atestado</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {form.photo_path && !selectedFile && (
                        <p className="mt-1 text-xs text-green-600">Um atestado já foi anexado. Envie outro para substituir.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações (Opcional)</label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
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
    </div>
  );
}
