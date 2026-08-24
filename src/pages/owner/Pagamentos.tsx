import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, QrCode, Copy, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function OwnerPagamentos() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [pixResult, setPixResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [empRes, assRes, pagRes] = await Promise.all([
        supabase.from('empresas').select('*').order('nome'),
        supabase.from('assinaturas').select('*, plano:planos(*)'),
        supabase.from('platform_payments').select('*, empresa:empresas(nome), plano:planos(nome)').order('created_at', { ascending: false })
      ]);

      if (empRes.data) setEmpresas(empRes.data);
      if (assRes.data) setAssinaturas(assRes.data);
      if (pagRes.data) setPagamentos(pagRes.data);
      
      if (empRes.data && empRes.data.length > 0 && !selectedEmpresaId) {
        setSelectedEmpresaId(empRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleGerarPix = async () => {
    setError('');
    setPixResult(null);
    setGerando(true);
    try {
      const ass = assinaturas.find(a => a.empresa_id === selectedEmpresaId);
      const emp = empresas.find(e => e.id === selectedEmpresaId);
      
      if (!ass) {
        throw new Error("Esta empresa não possui uma assinatura configurada.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado.");
      }
      
      const isOwner = session.user.app_metadata?.platform_role === 'owner';
      if (!isOwner) {
        throw new Error("Acesso restrito ao dono do aplicativo.");
      }

      const payload = {
        empresa_id: selectedEmpresaId,
        plano_id: ass.plano_id,
        assinatura_id: ass.id,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payer_email: emp?.email || 'contato@pceg.com.br'
      };

      const { data, error: fnError } = await supabase.functions.invoke('mercadopago-create-payment-secure', {
        body: payload
      });

      if (fnError) {
        console.error(fnError);
        throw new Error("Mercado Pago recusou a cobrança ou serviço indisponível.");
      }

      setPixResult(data);
      loadData(); // refresh payments list
    } catch (e: any) {
      setError(e.message || "Não foi possível gerar a cobrança.");
    } finally {
      setGerando(false);
    }
  };

  const copiarPix = () => {
    if (pixResult?.qr_code || pixResult?.qr_code_text) {
      navigator.clipboard.writeText(pixResult.qr_code || pixResult.qr_code_text);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">Aguardando pagamento</span>;
      case 'PAID': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Pago</span>;
      case 'FAILED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Falhou</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Cancelado</span>;
      case 'REFUNDED': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Estornado</span>;
      case 'CHARGEBACK': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Contestação</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedAssinatura = assinaturas.find(a => a.empresa_id === selectedEmpresaId);
  const selectedEmpresa = empresas.find(e => e.id === selectedEmpresaId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamentos</h1>
        <p className="text-gray-500 mt-1">Gerencie cobranças, PIX e assinaturas das empresas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestão de Cobrança */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Empresa</h2>
            </div>
            <div className="p-5">
              <select
                value={selectedEmpresaId}
                onChange={(e) => setSelectedEmpresaId(e.target.value)}
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedAssinatura ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Resumo da Assinatura</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Empresa</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEmpresa?.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Plano</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedAssinatura.plano?.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Mensalidade</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAssinatura.plano?.valor_mensal || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedAssinatura.status}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Nova cobrança PIX</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <button
                  onClick={handleGerarPix}
                  disabled={gerando}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {gerando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      GERAR PIX
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nenhuma assinatura encontrada para esta empresa.</p>
            </div>
          )}
        </div>

        {/* PIX Result */}
        <div>
          {pixResult ? (
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-5 bg-indigo-600 text-white flex justify-between items-center">
                <h2 className="text-lg font-semibold">PIX Gerado</h2>
                <span className="px-2 py-1 bg-indigo-500/50 rounded text-xs font-medium border border-indigo-400">
                  Aguardando pagamento
                </span>
              </div>
              <div className="p-6 flex flex-col items-center">
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixResult.total_amount || selectedAssinatura?.plano?.valor_mensal || 0)}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Vencimento: {pixResult.expiration_date ? new Date(pixResult.expiration_date).toLocaleString('pt-BR') : '24 horas'}
                </p>
                
                {pixResult.qr_code_base64 && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <img 
                      src={pixResult.qr_code_base64.startsWith('data:') ? pixResult.qr_code_base64 : `data:image/png;base64,${pixResult.qr_code_base64}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                )}
                
                {(pixResult.qr_code || pixResult.qr_code_text) && (
                  <div className="w-full space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pix Copia e Cola</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixResult.qr_code || pixResult.qr_code_text} 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
                      />
                      <button 
                        onClick={copiarPix}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0 border border-gray-200"
                      >
                        {copiado ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copiado ? 'Copiado!' : 'COPIAR PIX'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 w-full flex justify-center">
                  <button 
                    onClick={loadData}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar status
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6">
              <QrCode className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Gere uma cobrança para visualizar o PIX</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Pagamentos</h2>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap">Empresa</th>
                <th className="p-4 whitespace-nowrap">Plano</th>
                <th className="p-4 whitespace-nowrap">Valor</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Método</th>
                <th className="p-4 whitespace-nowrap">Vencimento</th>
                <th className="p-4 whitespace-nowrap">Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagamentos.length > 0 ? (
                pagamentos.map((pag) => (
                  <tr key={pag.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">{pag.empresa?.nome || '-'}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{pag.plano?.nome || '-'}</td>
                    <td className="p-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pag.valor || 0)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(pag.status)}
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{pag.metodo || 'PIX'}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {pag.data_vencimento ? new Date(pag.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {pag.referencia_externa || pag.id.split('-')[0]}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                    Nenhum pagamento registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
