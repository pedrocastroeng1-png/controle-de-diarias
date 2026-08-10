import { useAuth } from '../../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Ferramenta, Funcionario, Obra } from '../../../lib/types';
import { UserCheck, Search, CheckSquare, Square, ImageOff } from 'lucide-react';

export default function Emprestimos() {
  const { usuario } = useAuth();
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  
  const [selectedFerramentas, setSelectedFerramentas] = useState<string[]>([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [obraId, setObraId] = useState('');
  
  const [searchFerramenta, setSearchFerramenta] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ferData, funcData, obData] = await Promise.all([
        api.getFerramentas(),
        api.getFuncionarios(),
        api.getObras()
      ]);
      setFerramentas(ferData.filter(f => f.status === 'ATIVA'));
      setFuncionarios(funcData.filter(f => f.ativo));
      setObras(obData);
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Erro ao carregar dados', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filteredFerramentas = ferramentas.filter(f => 
    f.nome.toLowerCase().includes(searchFerramenta.toLowerCase()) || 
    f.codigo_interno.toLowerCase().includes(searchFerramenta.toLowerCase()) ||
    (f.marca && f.marca.toLowerCase().includes(searchFerramenta.toLowerCase()))
  );

  const toggleFerramenta = (id: string) => {
    setSelectedFerramentas(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const newSelected = new Set([...selectedFerramentas, ...filteredFerramentas.map(f => f.id)]);
    setSelectedFerramentas(Array.from(newSelected));
  };

  const clearSelection = () => {
    setSelectedFerramentas([]);
  };

  async function handleEmprestar(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFerramentas.length === 0 || !funcionarioId || !obraId) {
      setMessage({ text: 'Selecione pelo menos uma ferramenta, um funcionário e uma obra.', type: 'error' });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      
      const results = await Promise.allSettled(
        selectedFerramentas.map(id => api.emprestarFerramenta(id, funcionarioId, obraId, usuario!.id))
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length === 0) {
        setMessage({ text: `${selectedFerramentas.length} ferramenta(s) emprestada(s) com sucesso!`, type: 'success' });
        setSelectedFerramentas([]);
        setFuncionarioId('');
        setObraId('');
        loadData(); 
      } else {
        // Find which ones failed
        const failedIds = selectedFerramentas.filter((_, index) => results[index].status === 'rejected');
        const failedNames = ferramentas.filter(f => failedIds.includes(f.id)).map(f => f.codigo_interno).join(', ');
        
        setMessage({ 
          text: `Erro ao emprestar algumas ferramentas: ${failedNames}. As demais foram processadas.`, 
          type: 'error' 
        });
        // Remove successful ones from selection
        const successfulIds = selectedFerramentas.filter((_, index) => results[index].status === 'fulfilled');
        setSelectedFerramentas(prev => prev.filter(id => !successfulIds.includes(id)));
        loadData();
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || 'Erro ao processar empréstimo', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Carregando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
          Novo Empréstimo
        </h3>
        <p className="text-sm text-gray-500 mt-1">Selecione as ferramentas, o funcionário e a obra.</p>
      </div>

      <div className="p-6">
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleEmprestar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
              <select
                required
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Selecione o funcionário</option>
                {funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
              <select
                required
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Selecione a obra</option>
                {obras.map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Ferramentas Disponíveis (ATIVAS)</label>
              <div className="text-sm text-blue-600 font-medium">
                {selectedFerramentas.length} ferramenta(s) selecionada(s)
              </div>
            </div>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex gap-3 items-center justify-between">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por código ou nome..."
                    value={searchFerramenta}
                    onChange={(e) => setSearchFerramenta(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                    Selecionar Todas
                  </button>
                  <button type="button" onClick={clearSelection} className="text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    Limpar
                  </button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {filteredFerramentas.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Nenhuma ferramenta encontrada.
                  </div>
                ) : (
                  filteredFerramentas.map(f => {
                    const isSelected = selectedFerramentas.includes(f.id);
                    return (
                      <div 
                        key={f.id} 
                        onClick={() => toggleFerramenta(f.id)}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                          {f.foto_path ? (
                             <img src={f.foto_path} alt={f.nome} className="h-full w-full object-cover" />
                          ) : (
                             <ImageOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{f.codigo_interno} - {f.nome}</p>
                          {f.marca && <p className="text-xs text-gray-500 truncate">{f.marca} {f.modelo}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || selectedFerramentas.length === 0 || !funcionarioId || !obraId}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Registrando...' : 'Registrar Empréstimo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
