import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Ferramenta } from '../../../lib/types';
import { CheckCircle, Plus, Edit2, Archive, ArchiveRestore, Wrench, Search, Upload, Eye, ImageOff, MoreVertical, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function ListaFerramentas() {
  const { usuario } = useAuth();
  const isMobile = useIsMobile();
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODAS');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [codigoInterno, setCodigoInterno] = useState('');
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [removeFoto, setRemoveFoto] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Mobile Bottom Sheet state
  const [selectedMobileTool, setSelectedMobileTool] = useState<Ferramenta | null>(null);

  useEffect(() => {
    loadFerramentas();
  }, []);

  async function loadFerramentas() {
    try {
      setLoading(true);
      const data = await api.getFerramentas();
      setFerramentas(data);
      
      const urls: Record<string, string> = {};
      data.forEach(f => {
        if (f.foto_path) urls[f.id] = f.foto_path;
      });
      setImageUrls(urls);
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(f?: Ferramenta) {
    if (f) {
      setEditId(f.id);
      setCodigoInterno(f.codigo_interno);
      setNome(f.nome);
      setMarca(f.marca || '');
      setModelo(f.modelo || '');
      setObservacoes(f.observacoes || '');
    } else {
      setEditId(null);
      setCodigoInterno('');
      setNome('');
      setMarca('');
      setModelo('');
      setObservacoes('');
    }
    setFoto(null);
    setRemoveFoto(false);
    setShowModal(true);
    setSelectedMobileTool(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      const data: any = {
        codigo_interno: codigoInterno,
        nome,
        marca,
        modelo,
        observacoes,
      };

      if (removeFoto) {
        data.foto_path = null;
      } else if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = await api.uploadPhoto('ferramentas-fotos', foto, fileName);
        if (filePath) {
           data.foto_path = filePath;
        }
      }

      if (editId) {
        await api.updateFerramenta(editId, data, usuario!.id);
      } else {
        await api.createFerramenta(data, usuario!.id);
      }
      
      setShowModal(false);
      loadFerramentas();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar ferramenta');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtiva(f: Ferramenta) {
    if (confirm(`Deseja ${f.status === 'INATIVA' ? 'reativar' : 'inativar'} esta ferramenta?`)) {
      try {
        if (f.status === 'INATIVA') {
          await api.updateFerramenta(f.id, { status: 'ATIVA' }, usuario!.id);
        } else {
          await api.inativarFerramenta(f.id, 'Inativada pelo usuário', usuario!.id);
        }
        loadFerramentas();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao alterar status');
      }
    }
  }

  async function handleMarcarReparo(f: Ferramenta) {
    if (confirm('Enviar esta ferramenta para reparo?')) {
      try {
        await api.marcarReparoFerramenta(f.id, 'Enviada para reparo via painel', usuario!.id);
        loadFerramentas();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao enviar para reparo');
      }
    }
  }

  async function handleMarcarPerdida(f: Ferramenta) {
    if (confirm('Marcar esta ferramenta como perdida?')) {
      try {
        await api.marcarPerdidaFerramenta(f.id, 'Marcada como perdida via painel', usuario!.id);
        loadFerramentas();
        setSelectedMobileTool(null);
      } catch (error: any) {
        alert(error.message || 'Erro ao marcar como perdida');
      }
    }
  }

  const filtered = ferramentas.filter(f => 
    (filterStatus === 'TODAS' || f.status === filterStatus) &&
    (
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const statusColors: any = {
    ATIVA: 'bg-green-100 text-green-800',
    EMPRESTADA: 'bg-blue-100 text-blue-800',
    EM_REPARO: 'bg-orange-100 text-orange-800',
    PERDIDA: 'bg-red-100 text-red-800',
    INATIVA: 'bg-gray-100 text-gray-800',
    QUEBRADA: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventário de Ferramentas</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Ferramenta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full flex-1">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="TODAS">Todos os Status</option>
              <option value="ATIVA">Ativa</option>
              <option value="EMPRESTADA">Emprestada</option>
              <option value="EM_REPARO">Em Reparo</option>
              <option value="QUEBRADA">Quebrada</option>
              <option value="PERDIDA">Perdida</option>
              <option value="INATIVA">Inativa</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Carregando ferramentas...</div>
      ) : isMobile ? (
        <div className="space-y-4">
          {filtered.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                   {f.foto_path ? (
                     <img src={f.foto_path} alt={f.nome} className="h-full w-full object-cover" />
                   ) : (
                     <ImageOff className="h-6 w-6 text-gray-400" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{f.nome}</h3>
                  <p className="text-sm text-gray-500 truncate">Cód: {f.codigo_interno}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[f.status] || 'bg-gray-100 text-gray-800'}`}>
                      {f.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{f.marca}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 p-2 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedMobileTool(f)}
                  className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm active:bg-gray-50 w-full justify-center"
                >
                  <MoreVertical className="h-4 w-4 mr-2" /> Ações
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Nenhuma ferramenta encontrada.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                           {imageUrls[f.id] ? (
                             <img src={imageUrls[f.id]} alt="" className="h-10 w-10 object-cover" />
                           ) : (
                             <Wrench className="h-5 w-5 text-gray-500" />
                           )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{f.nome}</div>
                          <div className="text-xs text-gray-500">Cód: {f.codigo_interno}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.marca} {f.modelo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[f.status] || 'bg-gray-100 text-gray-800'}`}>
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/admin/ferramentas/${f.id}`} className="text-blue-600 hover:text-blue-900 mr-4 inline-block" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </a>
                      <button onClick={() => openModal(f)} className="text-green-600 hover:text-green-900 mr-4" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      
                      {f.status === 'ATIVA' && (
                        <>
                        <button onClick={() => handleMarcarReparo(f)} className="text-orange-500 hover:text-orange-700 mr-4" title="Enviar para Reparo">
                          <Wrench className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleMarcarPerdida(f)} className="text-red-600 hover:text-red-900 mr-4" title="Marcar como Perdida">
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                        </>
                      )}
                      <button onClick={() => handleToggleAtiva(f)} className="text-gray-500 hover:text-gray-700" title={f.status === 'INATIVA' ? 'Reativar' : 'Inativar'}>
                        {f.status === 'INATIVA' ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Actions */}
      {selectedMobileTool && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedMobileTool(null)}></div>
          <div className="relative bg-white rounded-t-2xl w-full p-4 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                   {selectedMobileTool.foto_path ? (
                     <img src={selectedMobileTool.foto_path} alt="" className="h-full w-full object-cover" />
                   ) : (
                     <ImageOff className="h-5 w-5 text-gray-400" />
                   )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMobileTool.nome}</h3>
                  <p className="text-sm text-gray-500">Cód: {selectedMobileTool.codigo_interno}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMobileTool(null)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <a href={`/admin/ferramentas/${selectedMobileTool.id}`} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Visualizar Detalhes</span>
              </a>

              <button onClick={() => openModal(selectedMobileTool)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
                  <Edit2 className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-gray-900">Editar Ferramenta</span>
              </button>

              {selectedMobileTool.status === 'ATIVA' && (
                <>
                  <button onClick={() => handleMarcarReparo(selectedMobileTool)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                    <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-4">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <span className="text-base font-semibold text-gray-900">Enviar para Reparo</span>
                  </button>
                  <button onClick={() => handleMarcarPerdida(selectedMobileTool)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                    <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-4">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <span className="text-base font-semibold text-gray-900">Marcar como Perdida</span>
                  </button>
                </>
              )}

              <button onClick={() => handleToggleAtiva(selectedMobileTool)} className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-4">
                  {selectedMobileTool.status === 'INATIVA' ? <ArchiveRestore className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
                </div>
                <span className="text-base font-semibold text-gray-900">
                  {selectedMobileTool.status === 'INATIVA' ? 'Reativar Ferramenta' : 'Inativar Ferramenta'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editId ? 'Editar Ferramenta' : 'Nova Ferramenta'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Código Interno</label>
                      <input type="text" required value={codigoInterno} onChange={e => setCodigoInterno(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-1 md:col-span-4 mb-4">
                        <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
                          Foto da Ferramenta
                        </label>
                        <input
                          type="file"
                          id="foto"
                          accept="image/*"
                          onChange={(e) => { setFoto(e.target.files?.[0] || null); setRemoveFoto(false); }}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        />
                        {(foto || (editId && ferramentas.find(f => f.id === editId)?.foto_path && !removeFoto)) && (
                          <div className="mt-2 relative inline-block">
                            <img src={foto ? URL.createObjectURL(foto) : imageUrls[editId!] || ''} className="h-20 w-20 object-cover rounded-md border border-gray-300" alt="Preview" />
                            <button type="button" onClick={() => { setFoto(null); setRemoveFoto(true); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                              <span className="sr-only">Remover</span>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marca</label>
                        <input type="text" value={marca} onChange={e => setMarca(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Modelo</label>
                        <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações</label>
                      <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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
