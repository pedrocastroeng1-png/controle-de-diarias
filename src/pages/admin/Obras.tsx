import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Obra } from '../../lib/types';
import { Edit2, Trash2, Plus } from 'lucide-react';

export default function Obras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [nome, setNome] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadObras();
  }, []);

  async function loadObras() {
    setLoading(true);
    setErro('');
    try {
      const data = await api.getObras();
      setObras(data);
    } catch (error) {
      setErro('Ocorreu um erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || saving) return;
    setSaving(true);
    setErro('');
    try {
      if (editId) {
        await api.updateObra(editId, { nome });
        setEditId(null);
      } else {
        await api.createObra({ nome });
      }
      setNome('');
      await loadObras();
    } catch (error) {
      setErro('Ocorreu um erro ao salvar os dados.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta obra?')) {
      setLoading(true);
      setErro('');
      try {
        await api.deleteObra(id);
        await loadObras();
      } catch (error) {
        setErro('Ocorreu um erro ao excluir.');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleEdit(obra: Obra) {
    setEditId(obra.id);
    setNome(obra.nome);
  }

  const filteredObras = obras.filter(obra => 
    obra.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Obras</h2>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Pesquisar obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {erro && (<div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{erro}</div>)}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Obra
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors h-[42px]"
          >
            {editId ? 'Salvar' : <><Plus className="h-4 w-4 mr-2" /> Salvar</>}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setNome(''); }}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors h-[42px]"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th scope="col" className="relative px-6 py-3 w-24 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">Carregando...</td></tr>
            ) : (
              filteredObras.length === 0 ? (
              <tr>
                 <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                   Nenhuma obra encontrada.
                 </td>
              </tr>
            ) : filteredObras.map((obra) => (
              <tr key={obra.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {obra.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3 justify-center">
                  <button onClick={() => handleEdit(obra)} className="text-blue-600 hover:text-blue-900 p-1" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(obra.id)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
