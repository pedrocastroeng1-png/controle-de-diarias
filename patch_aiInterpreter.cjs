const fs = require('fs');

const newCode = `export interface AmbiguousMaterial {
  id: string;
  nome: string;
  unidade?: string;
}

export interface ParsedPurchaseItem {
  id?: string;
  material_id: string | null;
  material_nome?: string;
  quantidade: number | null;
  unidade?: string;
  funcionario_id: string | null;
  funcionario_nome?: string;
  confidence: number;
  needs_confirmation: boolean;
  ambiguous_materials?: AmbiguousMaterial[];
}

export interface ParsedPurchase {
  obra_id: string | null;
  obra_nome?: string;
  items: ParsedPurchaseItem[];
  data: string | null;
  fornecedor: string | null;
  recibo: string | null;
  observacao: string | null;
}

export interface CatalogItem {
  id: string;
  nome: string;
  [key: string]: unknown;
}

export interface Catalog {
  materiais: CatalogItem[];
  obras: CatalogItem[];
  funcionarios: CatalogItem[];
}

export function normalizeParsedPurchaseResponse(data: unknown): ParsedPurchase {
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta inválida: o formato retornado não é um objeto.');
  }

  const payload = data as Record<string, unknown>;

  if (!Array.isArray(payload.items)) {
    throw new Error('Não foi possível interpretar essa compra. Tente descrever novamente.');
  }

  const normalizedItems: ParsedPurchaseItem[] = payload.items.map((item: unknown, idx: number) => {
    if (!item || typeof item !== 'object') {
      return {
        id: \`ai-item-\${idx}-\${crypto.randomUUID()}\`,
        material_id: null,
        quantidade: null,
        funcionario_id: null,
        confidence: 0,
        needs_confirmation: true
      };
    }

    const obj = item as Record<string, unknown>;

    let ambiguous_materials: AmbiguousMaterial[] | undefined = undefined;
    if (Array.isArray(obj.ambiguous_materials)) {
      ambiguous_materials = obj.ambiguous_materials.map((m: unknown) => {
        const mObj = (m || {}) as Record<string, unknown>;
        return {
          id: mObj.id ? String(mObj.id) : '',
          nome: mObj.nome ? String(mObj.nome) : '',
          unidade: mObj.unidade ? String(mObj.unidade) : undefined,
        };
      }).filter(m => m.id !== '');
    }

    return {
      id: obj.id ? String(obj.id) : \`ai-item-\${idx}-\${crypto.randomUUID()}\`,
      material_id: obj.material_id ? String(obj.material_id) : null,
      material_nome: obj.material_nome ? String(obj.material_nome) : undefined,
      quantidade: (obj.quantidade !== null && obj.quantidade !== undefined && !Number.isNaN(Number(obj.quantidade))) 
                    ? Number(obj.quantidade) 
                    : null,
      unidade: obj.unidade ? String(obj.unidade) : undefined,
      funcionario_id: obj.funcionario_id ? String(obj.funcionario_id) : null,
      funcionario_nome: obj.funcionario_nome ? String(obj.funcionario_nome) : undefined,
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 0,
      needs_confirmation: Boolean(obj.needs_confirmation),
      ambiguous_materials: ambiguous_materials && ambiguous_materials.length > 0 ? ambiguous_materials : undefined,
    };
  });

  return {
    obra_id: payload.obra_id ? String(payload.obra_id) : null,
    obra_nome: payload.obra_nome ? String(payload.obra_nome) : undefined,
    items: normalizedItems,
    data: payload.data ? String(payload.data) : null,
    fornecedor: payload.fornecedor ? String(payload.fornecedor) : null,
    recibo: payload.recibo ? String(payload.recibo) : null,
    observacao: payload.observacao ? String(payload.observacao) : null,
  };
}

export async function interpretPurchaseText(
  text: string, 
  catalog: Catalog
): Promise<ParsedPurchase> {
  const { supabase } = await import('./supabase');
  
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !sessionData?.session) {
    throw new Error('Não foi possível identificar o usuário atual.');
  }

  const { data, error } = await supabase.functions.invoke('interpret-material-purchase', {
    body: { text, catalog }
  });

  if (error) {
    console.error("Erro na edge function:", error.message || error);
    const errString = String(error.message || error).toLowerCase();
    if (errString.includes('unauthorized') || errString.includes('401')) {
      throw new Error('Não foi possível autenticar a solicitação. Faça login novamente.');
    }
    throw new Error('Não foi possível interpretar a compra agora. Tente novamente.');
  }

  return normalizeParsedPurchaseResponse(data);
}
`;

fs.writeFileSync('src/lib/aiInterpreter.ts', newCode, 'utf8');
