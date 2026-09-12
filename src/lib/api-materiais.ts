import { supabase } from './supabase';
import { fornecedorIdFromResult } from './rpc-results';
import { withEmpresa, getEmpresaId } from './api';

const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem("@diarias:usuario");
    if (userStr) {
      return JSON.parse(userStr).id;
    }
  } catch (e) {}
  return null;
};

export const apiMateriais = {
  getEstoqueMateriais: async (obraId?: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from('vw_estoque_materiais').select('*'));
    if (obraId) {
      query = query.eq('obra_id', obraId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getEstoqueMateriaisConsolidado: async (obraPrincipalId?: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from('vw_estoque_materiais_consolidado').select('*'));
    if (obraPrincipalId) {
      query = query.eq('obra_principal_id', obraPrincipalId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getMovimentacoesMateriais: async (filters?: { obraId?: string, materialId?: string, tipo?: string }) => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from('vw_movimentacoes_materiais').select('*').order('data_movimento', { ascending: false }).order('created_at', { ascending: false }));
    
    if (filters?.obraId) {
      // Some DB functions or views don't like direct OR on UUIDs if parent isn't there, 
      // but let's assume filtering by obra_id or parent_obra_id works. 
      // A safer approach is to filter by obra_id = X or obra_principal_id = X
      query = query.or(`obra_id.eq.${filters.obraId},obra_principal_id.eq.${filters.obraId},obra_destino_id.eq.${filters.obraId}`);
    }
    if (filters?.materialId) {
      query = query.eq('material_id', filters.materialId);
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getRelatorioComprasMateriais: async (filters?: { obraId?: string, startDate?: string, endDate?: string }) => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from('vw_relatorio_compras_materiais').select('*').order('data_compra', { ascending: false }));
    
    if (filters?.obraId) {
      query = query.or(`obra_id.eq.${filters.obraId},obra_principal_id.eq.${filters.obraId}`);
    }
    if (filters?.startDate) {
      query = query.gte('data_compra', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('data_compra', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  registrarMovimentacao: async (params: {
    tipo: 'ENTRADA' | 'SAIDA' | 'PERDA' | 'TRANSFERENCIA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SAIDA';
    material_id: string;
    obra_id: string;
    quantidade: number;
    motivo?: string;
    observacao?: string;
    obra_destino_id?: string;
    data_movimento?: string;
  }) => {
    if (!supabase) throw new Error("Supabase não configurado");
    
    const empresa_id = getEmpresaId();
    const usuario_id = getCurrentUserId();
    
    if (!empresa_id) throw new Error("Empresa não identificada.");
    if (!usuario_id) throw new Error("Usuário não identificado.");
    
    const { data, error } = await supabase.rpc('registrar_movimentacao_material', {
      p_empresa_id: empresa_id,
      p_material_id: params.material_id,
      p_obra_id: params.obra_id,
      p_tipo: params.tipo,
      p_quantidade: params.quantidade,
      p_data_movimento: params.data_movimento || new Date().toISOString().split('T')[0],
      p_obra_destino_id: params.obra_destino_id || undefined,
      p_motivo: params.motivo || undefined,
      p_observacao: params.observacao || undefined,
      p_usuario_id: usuario_id
    });
    
    if (error) throw error;
    return data;
  }
};

// ADDED RPC WRAPPERS
export const apiMateriaisRPC = {
  cadastrarFornecedorRapido: async (params: { p_nome: string }) => {
    const { supabase } = await import('./supabase');
    const { getEmpresaId } = await import('./api');
    if (!supabase) throw new Error("Supabase não configurado");
    const empresa_id = getEmpresaId();
    const usuario_id = getCurrentUserId();
    if (!empresa_id) throw new Error("Empresa não identificada.");
    if (!usuario_id) throw new Error("Usuário não identificado.");
    
    const { data, error } = await supabase.rpc('cadastrar_fornecedor_rapido', {
      p_empresa_id: empresa_id,
      p_nome: params.p_nome,
      p_usuario_id: usuario_id
    });
    
    if (error) throw error;
    return fornecedorIdFromResult(data);
  },
  
  registrarCompraMaterial: async (params: {
    p_data_compra: string | null;
    p_fornecedor_id: string | null;
    p_numero_recibo: string | null;
    p_obra_id: string;
    p_itens: any[];
  }) => {
    const { supabase } = await import('./supabase');
    const { getEmpresaId } = await import('./api');
    if (!supabase) throw new Error("Supabase não configurado");
    const empresa_id = getEmpresaId();
    const usuario_id = getCurrentUserId();
    if (!empresa_id) throw new Error("Empresa não identificada.");
    if (!usuario_id) throw new Error("Usuário não identificado.");
    
    if (!params.p_fornecedor_id) throw new Error('Selecione um fornecedor.');
    const { data, error } = await supabase.rpc('registrar_compra_material', {
      p_data_compra: params.p_data_compra || undefined,
      p_empresa_id: empresa_id,
      p_fornecedor_id: params.p_fornecedor_id,
      p_itens: params.p_itens,
      p_numero_recibo: params.p_numero_recibo || undefined,
      p_obra_id: params.p_obra_id,
      p_usuario_id: usuario_id
    });
    
    if (error) throw error;
    return data;
  },

  excluirCompraMaterial: async (compra_id: string) => {
    const { supabase } = await import('./supabase');
    const { getEmpresaId } = await import('./api');
    if (!supabase) throw new Error("Supabase não configurado");
    const empresa_id = getEmpresaId();
    const usuario_id = getCurrentUserId();
    if (!empresa_id) throw new Error("Empresa não identificada.");
    if (!usuario_id) throw new Error("Usuário não identificado.");
    
    const { error } = await supabase.rpc('excluir_compra_material', {
      p_empresa_id: empresa_id,
      p_usuario_id: usuario_id,
      p_compra_id: compra_id
    });
    
    if (error) throw error;
    return true;
  }
};
