import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Plus, Trash2, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { parseISO, format, formatISO } from 'date-fns';

export default function Feriados() {
  const { usuario } = useAuth();
  const [feriados, setFeriados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Auth state for JWT
  const [needsAuth, setNeedsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Impact Preview State
  const [impactPreview, setImpactPreview] = useState<any>(null);
  const [calculatingImpact, setCalculatingImpact] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (usuario) loadFeriados();
  }, [usuario]);

  async function loadFeriados() {
    try {
      setLoading(true);
      setError('');
      // Check if we have token
      const token = localStorage.getItem('@diarias:token');
      if (!token) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      
      const list = await api.getFeriados();
      setFeriados(list);
    } catch (e: any) {
      if (e.message.includes('Faça login novamente')) {
        setNeedsAuth(true);
      } else {
        setError(e.message || 'Erro ao carregar feriados');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    
    try {
      setAuthenticating(true);
      setAuthError('');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario?.usuario, senha: password })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Senha incorreta');
      
      if (json.token) {
        localStorage.setItem('@diarias:token', json.token);
        setNeedsAuth(false);
        loadFeriados();
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthenticating(false);
    }
  }

  async function calculateImpact(dateStr: string) {
    setCalculatingImpact(true);
    try {
      // Fetch report for the specific date to see impact
      const [registros, atestados, funcionarios, currentFeriados] = await Promise.all([
        api.getRelatorio(dateStr, dateStr),
        api.getAtestados(),
        api.getFuncionarios('todos'),
        api.getFeriados()
      ]);
      
      // Calculate BEFORE
      const { aplicarAtestados } = await import('../../lib/atestados-relatorio');
      
      // Filter holidays - remove the date if it's already there (shouldn't be, but just in case)
      const existingDates = currentFeriados.map((f: any) => f.data).filter((d: string) => d !== dateStr);
      
      const beforeRegistros = aplicarAtestados(registros, atestados, funcionarios, { inicio: dateStr, fim: dateStr }, existingDates);
      let beforeTotal = 0;
      let beforeCount = 0;
      
      for (const r of beforeRegistros) {
        const val = r.valor_diaria || 0;
        if (val > 0) {
          beforeTotal += val;
          beforeCount++;
        }
      }
      
      // Calculate AFTER (with the new holiday)
      const afterDates = [...existingDates, dateStr];
      const afterRegistros = aplicarAtestados(registros, atestados, funcionarios, { inicio: dateStr, fim: dateStr }, afterDates);
      
      let afterTotal = 0;
      let afterCount = 0;
      
      for (const r of afterRegistros) {
        const val = r.valor_diaria || 0;
        if (val > 0) {
          afterTotal += val;
          afterCount++;
        }
      }
      
      setImpactPreview({
        affectedCount: beforeCount - afterCount,
        reductionAmount: beforeTotal - afterTotal,
        beforeTotal,
        afterTotal
      });
      setShowConfirm(true);
    } catch (e: any) {
      setError('Erro ao calcular impacto: ' + e.message);
    } finally {
      setCalculatingImpact(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // First step: preview impact
    if (!showConfirm) {
      await calculateImpact(data);
      return;
    }
    
    // Second step: confirm and save
    try {
      setSaving(true);
      setError('');
      await api.createFeriado(data, descricao);
      setIsModalOpen(false);
      setData('');
      setDescricao('');
      setShowConfirm(false);
      setImpactPreview(null);
      loadFeriados();
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar feriado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover este feriado? Os cálculos serão refeitos.')) return;
    try {
      setLoading(true);
      await api.deleteFeriado(id);
      loadFeriados();
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir feriado');
      setLoading(false);
    }
  }
  
  if (needsAuth) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <ShieldAlert className="w-12 h-12 text-blue-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
          <p className="text-sm text-gray-500 mt-1">
            Por motivos de segurança, confirme sua senha para acessar o gerenciamento de feriados.
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          {authError && (
            <div className="text-red-600 text-sm">{authError}</div>
          )}
          <button
            type="submit"
            disabled={authenticating}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {authenticating ? 'Autenticando...' : 'Acessar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feriados</h1>
          <p className="text-gray-500 mt-1">Gerencie os feriados não remunerados da empresa</p>
        </div>
        
        {usuario?.perfil === 'ADMIN' && (
          <button
            onClick={() => {
              setData('');
              setDescricao('');
              setShowConfirm(false);
              setImpactPreview(null);
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Feriado
          </button>
        )}
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando feriados...</div>
        ) : feriados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum feriado cadastrado</h3>
            <p className="text-gray-500 mt-1">Os feriados adicionados bloquearão novas presenças e reduzirão cálculos de diárias.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feriados.map((feriado) => (
                  <tr key={feriado.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(parseISO(feriado.data), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {feriado.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {usuario?.perfil === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(feriado.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Remover feriado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" aria-hidden="true" onClick={() => !saving && setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                      Cadastrar Feriado
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  {!showConfirm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                        <input
                          type="date"
                          required
                          value={data}
                          onChange={e => setData(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                        <textarea
                          required
                          maxLength={500}
                          rows={3}
                          value={descricao}
                          onChange={e => setDescricao(e.target.value)}
                          placeholder="Ex: Feriado Nacional - Independência do Brasil"
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Impacto Previsto
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          O cadastro deste feriado afetará <strong>{impactPreview?.affectedCount}</strong> registros de presença ou atestados para a data {format(parseISO(data), 'dd/MM/yyyy')}.
                        </p>
                        <ul className="text-sm text-yellow-700 space-y-1 pl-5 list-disc font-medium">
                          <li>Total antes: R$ {impactPreview?.beforeTotal.toFixed(2)}</li>
                          <li>Total depois: R$ {impactPreview?.afterTotal.toFixed(2)}</li>
                          <li className="text-red-600 font-bold">Redução: -R$ {impactPreview?.reductionAmount.toFixed(2)}</li>
                        </ul>
                      </div>
                      <p className="text-sm text-gray-600">
                        Confirma o cadastro deste feriado? Os cálculos de diárias serão ajustados automaticamente.
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-gray-100 gap-2">
                  <button
                    type="submit"
                    disabled={saving || calculatingImpact}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {calculatingImpact ? 'Calculando...' : saving ? 'Salvando...' : showConfirm ? 'Confirmar e Salvar' : 'Continuar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => showConfirm ? setShowConfirm(false) : setIsModalOpen(false)}
                    disabled={saving || calculatingImpact}
                    className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                  >
                    {showConfirm ? 'Voltar' : 'Cancelar'}
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
