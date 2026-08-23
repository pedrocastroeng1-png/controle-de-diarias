import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, PenSquare } from 'lucide-react';
import { api } from '../lib/api';
import { interpretPurchaseText, ParsedPurchase } from '../lib/aiInterpreter';

interface SmartPurchaseFormProps {
  onCancel: () => void;
  onConfirm: (compraData: any, itensData: any[]) => void;
}

export default function SmartPurchaseForm({ onCancel, onConfirm }: SmartPurchaseFormProps) {
  const [text, setText] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedPurchase | null>(null);

  const [catalog, setCatalog] = useState<{ materiais: any[], obras: any[], funcionarios: any[] }>({
    materiais: [], obras: [], funcionarios: []
  });

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [mat, ob, func] = await Promise.all([
        api.getMateriais(),
        api.getObras(),
        api.getFuncionarios()
      ]);
      setCatalog({
        materiais: mat,
        obras: ob,
        funcionarios: func
      });
    } catch (err) {
      console.error('Failed to load catalog for AI', err);
    }
  };

  const handleInterpret = async () => {
    if (!text.trim()) {
      setError('Por favor, digite a descrição da compra.');
      return;
    }
    setError('');
    setIsInterpreting(true);
    try {
      const res = await interpretPurchaseText(text, catalog);
      setParsedResult(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao interpretar a compra.');
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult) return;
    
    // Convert to the exact format expected by ComprasMateriaisTab's manual form
    const compraForm = {
      data_compra: parsedResult.data || new Date().toISOString().split('T')[0],
      obra_id: parsedResult.obra_id || '',
      fornecedor: parsedResult.fornecedor || '',
      numero_recibo: parsedResult.recibo || '',
      observacao: parsedResult.observacao || ''
    };
    
    const itensForm = parsedResult.items.map(item => ({
      id: crypto.randomUUID(),
      categoria_id: catalog.materiais.find(m => m.id === item.material_id)?.categoria_id || '',
      material_id: item.material_id || '',
      quantidade: item.quantidade || 0,
      valor_unitario: 0,
      funcionario_id: item.funcionario_id || undefined
    }));
    
    onConfirm(compraForm, itensForm);
  };

  if (parsedResult) {
    const hasMissingObra = !parsedResult.obra_id;
    const hasInvalidItems = parsedResult.items.some(i => i.needs_confirmation || !i.material_id || !i.quantidade);
    const canConfirm = !hasMissingObra && !hasInvalidItems;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-3xl mx-auto shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          ENTENDI ASSIM
        </h3>
        
        <div className="space-y-6">
          {hasMissingObra && (
             <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
               <p className="text-amber-800 font-medium">Obra não identificada.</p>
               <p className="text-amber-700 text-sm mt-1">Volte e corrija o texto, ou continue no cadastro manual.</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Obra</p>
              <p className="font-medium text-gray-900 mt-1">
                {parsedResult.obra_nome || <span className="text-red-500">Não identificada</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</p>
              <p className="font-medium text-gray-900 mt-1">
                {parsedResult.data ? parsedResult.data.split('-').reverse().join('/') : 'Hoje'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fornecedor</p>
              <p className="font-medium text-gray-900 mt-1">{parsedResult.fornecedor || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Observação</p>
              <p className="font-medium text-gray-900 mt-1 truncate" title={parsedResult.observacao || ''}>
                {parsedResult.observacao || 'Não informada'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3 text-lg border-b pb-2">Itens Interpretados</h4>
            <div className="space-y-3">
              {parsedResult.items.map((item, idx) => (
                <div key={item.id} className={`p-4 rounded-lg border ${item.needs_confirmation ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900 text-lg">
                       {idx + 1}. {item.material_nome || <span className="text-red-500">Material não identificado</span>}
                    </div>
                    {item.funcionario_nome && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                        Para: {item.funcionario_nome}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex gap-6 text-sm text-gray-600">
                    <div>
                       <span className="font-semibold">Qtd:</span> {item.quantidade !== null ? `${item.quantidade} ${item.unidade || ''}` : <span className="text-red-500">Faltando</span>}
                    </div>
                  </div>

                  {item.ambiguous_materials && item.ambiguous_materials.length > 0 && (
                     <div className="mt-3 bg-white p-3 border border-amber-200 rounded text-sm">
                       <p className="text-amber-800 font-medium mb-2 flex items-center gap-2">
                         <AlertTriangle className="w-4 h-4" />
                         Encontrei mais de um material possível. Qual você comprou?
                       </p>
                       <div className="flex flex-wrap gap-2">
                         {item.ambiguous_materials.map(m => (
                           <button 
                             key={m.id}
                             onClick={() => {
                               const newResult = {...parsedResult};
                               const i = newResult.items.find(x => x.id === item.id);
                               if (i) {
                                 i.material_id = m.id;
                                 i.material_nome = m.nome;
                                 i.unidade = m.unidade;
                                 i.needs_confirmation = i.quantidade === null;
                                 i.ambiguous_materials = undefined;
                               }
                               setParsedResult(newResult);
                             }}
                             className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                           >
                             {m.nome}
                           </button>
                         ))}
                       </div>
                     </div>
                  )}

                  {!item.material_id && (!item.ambiguous_materials || item.ambiguous_materials.length === 0) && (
                     <p className="mt-2 text-sm text-red-600 font-medium">Material não identificado.</p>
                  )}
                  {item.material_id && item.quantidade === null && (
                     <p className="mt-2 text-sm text-red-600 font-medium">Qual quantidade foi comprada?</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => setParsedResult(null)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              VOLTAR
            </button>

            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canConfirm ? <CheckCircle2 className="w-5 h-5" /> : <PenSquare className="w-5 h-5" />}
              {canConfirm ? 'CONFIRMAR' : 'RESOLVA PENDÊNCIAS PARA CONFIRMAR'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-3xl mx-auto shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">LANÇAMENTO RÁPIDO</h2>
        <p className="text-gray-500">
          Descreva o que foi comprado. O sistema vai organizar as informações para você.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">O que você comprou?</label>
          <textarea
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={isInterpreting}
            placeholder="Ex.: Comprei 50 sacos de cimento para a obra Casa deputado"
            className="w-full rounded-xl border border-gray-300 p-4 text-lg focus:ring-blue-500 focus:border-blue-500 resize-none shadow-inner bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex gap-4 justify-between">
          <button
            onClick={onCancel}
            disabled={isInterpreting}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleInterpret}
            disabled={isInterpreting || !text.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 shadow-md"
          >
            {isInterpreting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Interpretando...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                INTERPRETAR COMPRA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
